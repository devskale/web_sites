document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById('cityInput');
    const searchButton = document.getElementById('searchButton');
    const cityNameDisplay = document.getElementById('cityName');

    const searchWrapper = document.getElementById('searchWrapper');
    const searchToggle = document.getElementById('searchToggle');

    // Default location & settings
    let currentLat = 47.949;
    let currentLon = 16.8417;
    let currentName = "Neusiedl am See";
    let currentDuration = 4;

    // Initialize with default location
    loadWeather(currentLat, currentLon, currentName);

    // Event listeners
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    searchToggle.addEventListener('click', () => {
        searchWrapper.classList.toggle('expanded');
        if (searchWrapper.classList.contains('expanded')) {
            searchInput.focus();
        }
    });

    // Geolocation button
    const geoBtn = document.getElementById('geoBtn');
    if (geoBtn) {
        geoBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert('Geolokalisierung wird von diesem Browser nicht unterstützt.');
                return;
            }
            geoBtn.classList.add('loading');
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    geoBtn.classList.remove('loading');
                    currentLat = pos.coords.latitude.toFixed(4);
                    currentLon = pos.coords.longitude.toFixed(4);
                    currentName = "Mein Standort";
                    loadWeather(currentLat, currentLon, currentName);
                },
                (err) => {
                    geoBtn.classList.remove('loading');
                    alert('Standort konnte nicht ermittelt werden: ' + err.message);
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
            );
        });
    }

    // Autocomplete Logic
    const debounce = (fn, delay) => {
        let timeoutId;
        return (...args) => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    };

    const fetchSuggestions = debounce((query) => {
        if (query.length < 2) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=de&format=json`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.results) {
                    renderSuggestions(data.results);
                } else {
                    suggestionsContainer.style.display = 'none';
                }
            })
            .catch(() => {
                suggestionsContainer.style.display = 'none';
            });
    }, 300);

    function renderSuggestions(results) {
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'block';

        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';

            const region = [result.admin1, result.country].filter(Boolean).join(', ');
            item.innerHTML = `
                ${result.name}
                <span>${region}</span>
            `;

            item.addEventListener('click', () => {
                loadWeather(result.latitude, result.longitude, result.name);
                searchInput.value = '';
                suggestionsContainer.style.display = 'none';
                searchWrapper.classList.remove('expanded');
            });

            suggestionsContainer.appendChild(item);
        });
    }

    const suggestionsContainer = document.getElementById('suggestions');

    searchInput.addEventListener('input', (e) => fetchSuggestions(e.target.value.trim()));

    // Close suggestions on click outside
    document.addEventListener('click', (e) => {
        if (!searchWrapper.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
            if (searchWrapper.classList.contains('expanded')) {
                searchWrapper.classList.remove('expanded');
            }
        }
    });

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentLat = btn.dataset.lat;
            currentLon = btn.dataset.lon;
            currentName = btn.dataset.city;
            loadWeather(currentLat, currentLon, currentName);
        });
    });

    // Duration buttons — all of them (both temp and solar sections)
    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const days = parseInt(btn.dataset.days);
            currentDuration = days;

            // Sync all duration selectors
            document.querySelectorAll('.duration-btn').forEach(b => {
                if (parseInt(b.dataset.days) === days) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });

            loadWeather(currentLat, currentLon, currentName);
        });
    });

    function handleSearch() {
        const city = searchInput.value.trim();
        if (!city) return;

        searchButton.disabled = true;
        searchButton.textContent = '...';

        const container = document.querySelector('.search-container');
        if (container) container.style.opacity = '0.7';

        const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de&format=json`;

        fetch(geocodingUrl)
            .then(response => response.json())
            .then(data => {
                if (data.results && data.results.length > 0) {
                    const result = data.results[0];
                    currentLat = result.latitude;
                    currentLon = result.longitude;
                    currentName = result.name;
                    loadWeather(currentLat, currentLon, currentName);
                    searchInput.value = '';
                    suggestionsContainer.style.display = 'none';
                    searchWrapper.classList.remove('expanded');
                } else {
                    alert('Stadt nicht gefunden. Bitte versuchen Sie es erneut.');
                }
            })
            .catch(error => {
                console.error('Error fetching location:', error);
                alert('Fehler bei der Suche. Bitte versuchen Sie es später erneut.');
            })
            .finally(() => {
                searchButton.disabled = false;
                searchButton.textContent = 'Go';
                if (container) container.style.opacity = '1';
            });
    }

    function loadWeather(lat, lon, name) {
        // Update title with animation
        cityNameDisplay.style.opacity = '0';
        setTimeout(() => {
            cityNameDisplay.textContent = `Wetter: ${name}`;
            cityNameDisplay.style.transition = 'opacity 0.4s ease-in-out';
            cityNameDisplay.style.opacity = '1';
            document.title = `${name} | Wetter Vorschau`;
        }, 150);

        // Load current weather overview
        loadCurrentWeather(lat, lon);

        // Load charts
        if (window.loadTemperatureData) {
            window.loadTemperatureData(lat, lon, name, currentDuration);
        }
        if (window.loadSolarData) {
            window.loadSolarData(lat, lon, name, currentDuration);
        }
    }

    // ========== Current Weather Overview ==========
    function loadCurrentWeather(lat, lon) {
        const cardsContainer = document.getElementById('weatherCards');
        const errorBanner = document.getElementById('weatherError');
        const sunStrip = document.getElementById('sunStrip');

        // Show skeleton state
        cardsContainer.innerHTML = `
            <div class="weather-card skeleton">
                <div class="skeleton-line" style="width:60px;height:60px;border-radius:50%;margin:0 auto"></div>
                <div class="skeleton-line" style="width:70px;height:22px;margin-top:8px"></div>
                <div class="skeleton-line" style="width:50px;height:14px;margin-top:4px"></div>
            </div>
            <div class="weather-card skeleton">
                <div class="skeleton-line" style="width:36px;height:12px;margin:0 auto"></div>
                <div class="skeleton-line" style="width:56px;height:26px;margin-top:6px"></div>
            </div>
            <div class="weather-card skeleton">
                <div class="skeleton-line" style="width:36px;height:12px;margin:0 auto"></div>
                <div class="skeleton-line" style="width:56px;height:26px;margin-top:6px"></div>
            </div>
            <div class="weather-card skeleton">
                <div class="skeleton-line" style="width:36px;height:12px;margin:0 auto"></div>
                <div class="skeleton-line" style="width:56px;height:26px;margin-top:6px"></div>
            </div>
        `;
        errorBanner.style.display = 'none';
        if (sunStrip) sunStrip.style.display = 'none';

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m` +
            `&daily=sunrise,sunset,daylight_duration` +
            `&timezone=auto`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (!data.current) {
                    throw new Error('No current data');
                }
                renderCurrentWeatherCards(data.current);
                renderSunStrip(data.daily, data.utc_offset_seconds || 0);
            })
            .catch(err => {
                console.error('Current weather error:', err);
                errorBanner.style.display = 'block';
                cardsContainer.innerHTML = '';
                if (sunStrip) sunStrip.style.display = 'none';
            });
    }

    function renderCurrentWeatherCards(current) {
        const temp = current.temperature_2m;
        const feelsLike = current.apparent_temperature;
        const humidity = current.relative_humidity_2m;
        const windSpeed = current.wind_speed_10m;
        const weatherCode = current.weather_code;

        const icon = getWeatherIcon(weatherCode);
        const desc = getWeatherDescription(weatherCode);

        // Wind direction → compass arrow + label
        const windDir = current.wind_direction_10m;
        const dirArrow = (typeof windDir === 'number')
            ? `<span class="wind-arrow" style="transform: rotate(${windDir + 180}deg)" title="${windDir}°">↑</span>`
            : '';
        const dirLabel = (typeof windDir === 'number') ? ' ' + compassLabel(windDir) : '';

        const cardsContainer = document.getElementById('weatherCards');
        cardsContainer.innerHTML = `
            <div class="weather-card">
                <div class="weather-icon">${icon}</div>
                <div class="card-value">${temp.toFixed(1)}°</div>
                <div class="card-sub">${desc}</div>
            </div>
            <div class="weather-card">
                <div class="card-label">Gefühlt</div>
                <div class="card-value">${feelsLike.toFixed(1)}°</div>
            </div>
            <div class="weather-card">
                <div class="card-label">Feuchte</div>
                <div class="card-value">${humidity}%</div>
            </div>
            <div class="weather-card">
                <div class="card-label">Wind${dirLabel}</div>
                <div class="card-value">${dirArrow}${windSpeed} <span style="font-size:0.8rem;font-weight:600">km/h</span></div>
            </div>
        `;
    }

    // ========== Sun strip (sunrise / sunset / daylight) ==========
    function renderSunStrip(daily, offsetSec) {
        const el = document.getElementById('sunStrip');
        if (!el || !daily || !daily.sunrise || !daily.sunrise.length) {
            if (el) el.style.display = 'none';
            return;
        }

        // sunrise/sunset come as location-local "YYYY-MM-DDTHH:MM"
        const sunrise = daily.sunrise[0];
        const sunset = daily.sunset[0];
        const daylight = daily.daylight_duration[0]; // seconds

        const fmtHM = (iso) => {
            const t = (iso.split('T')[1] || '00:00');
            return t.slice(0, 5);
        };
        const durHM = (sec) => {
            const h = Math.floor(sec / 3600);
            const m = Math.round((sec % 3600) / 60);
            return `${h}h ${String(m).padStart(2, '0')}m`;
        };

        el.innerHTML = `
            <span class="sun-item"><span class="sun-ico">↑</span> Sonnenaufgang <strong>${fmtHM(sunrise)}</strong></span>
            <span class="sun-item"><span class="sun-ico">↓</span> Sonnenuntergang <strong>${fmtHM(sunset)}</strong></span>
            <span class="sun-item"><span class="sun-ico">☀</span> Tageslicht <strong>${durHM(daylight)}</strong></span>
        `;
        el.style.display = 'flex';
    }

    function compassLabel(deg) {
        const dirs = ['N','NO','O','SO','S','SW','W','NW'];
        return dirs[Math.round(((deg % 360) / 45)) % 8];
    }

    // WMO Weather interpretation codes
    function getWeatherIcon(code) {
        const icons = {
            0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
            45: '🌫️', 48: '🌫️',
            51: '🌦️', 53: '🌦️', 55: '🌧️',
            56: '🌧️', 57: '🌧️',
            61: '🌧️', 63: '🌧️', 65: '🌧️',
            66: '🌧️', 67: '🌧️',
            71: '🌨️', 73: '🌨️', 75: '❄️',
            77: '❄️',
            80: '🌦️', 81: '🌧️', 82: '🌧️',
            85: '🌨️', 86: '❄️',
            95: '⛈️', 96: '⛈️', 99: '⛈️'
        };
        return icons[code] || '🌡️';
    }

    function getWeatherDescription(code) {
        const descriptions = {
            0: 'Klar', 1: 'Heiter', 2: 'Teilw. bewölkt', 3: 'Bewölkt',
            45: 'Nebel', 48: 'Reifnebel',
            51: 'Leichter Niesel', 53: 'Niesel', 55: 'Starker Niesel',
            56: 'Gefrierender Niesel', 57: 'Starker gefrier. Niesel',
            61: 'Leichter Regen', 63: 'Regen', 65: 'Starker Regen',
            66: 'Leichter gefrier. Regen', 67: 'Starker gefrier. Regen',
            71: 'Leichter Schneefall', 73: 'Schneefall', 75: 'Starker Schneefall',
            77: 'Schneekörner',
            80: 'Leichte Schauer', 81: 'Schauer', 82: 'Starke Schauer',
            85: 'Leichte Schneeschauer', 86: 'Schneeschauer',
            95: 'Gewitter', 96: 'Gewitter mit Hagel', 99: 'Schweres Gewitter'
        };
        return descriptions[code] || 'Unbekannt';
    }

    // Retry handlers exposed to global scope for onclick
    window.retryTemp = function () {
        if (currentLat && currentLon && currentName) {
            window.loadTemperatureData(currentLat, currentLon, currentName, currentDuration);
        }
    };

    window.retrySolar = function () {
        if (currentLat && currentLon && currentName) {
            window.loadSolarData(currentLat, currentLon, currentName, currentDuration);
        }
    };
});
