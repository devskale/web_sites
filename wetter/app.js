document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById('cityInput');
    const searchButton = document.getElementById('searchButton');
    const cityNameDisplay = document.getElementById('cityName');
    const suggestionsContainer = document.getElementById('suggestions');
    const btnText = searchButton.querySelector('.btn-text');

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

        // Enhanced loading state
        searchButton.disabled = true;
        if (btnText) btnText.textContent = 'Lädt...';

        // Add a subtle animation class to the search bar
        const container = document.querySelector('.search-container');
        if (container) container.style.opacity = '0.7';

        // Geocoding API
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
                    searchInput.value = ''; // Clear input
                    suggestionsContainer.style.display = 'none';
                    searchWrapper.classList.remove('expanded'); // Collapse after search
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
                if (btnText) btnText.textContent = 'Suchen';
                if (container) container.style.opacity = '1';
            });
    }

    function loadWeather(lat, lon, name) {
        // Update title with animation feel
        cityNameDisplay.style.opacity = '0';
        setTimeout(() => {
            cityNameDisplay.textContent = `Wetter: ${name}`;
            cityNameDisplay.style.transition = 'opacity 0.5s ease-in-out';
            cityNameDisplay.style.opacity = '1';
            document.title = `${name} | Wetter Vorschau`;
        }, 200);

        // Call functions from other scripts
        if (window.loadTemperatureData) {
            window.loadTemperatureData(lat, lon, name, currentDuration);
        }
        if (window.loadSolarData) {
            window.loadSolarData(lat, lon, name, currentDuration);
        }
    }
});
