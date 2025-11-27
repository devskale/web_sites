document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById('cityInput');
    const searchButton = document.getElementById('searchButton');
    const cityNameDisplay = document.getElementById('cityName');

    // Default location: Neusiedl am See
    const defaultLat = 47.949;
    const defaultLon = 16.8417;
    const defaultName = "Neusiedl am See";

    // Initialize with default location
    loadWeather(defaultLat, defaultLon, defaultName);

    // Event listeners
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    function handleSearch() {
        const city = searchInput.value.trim();
        if (!city) return;

        // Show loading state (optional, but good for UX)
        searchButton.disabled = true;
        searchButton.textContent = '...';

        // Geocoding API
        const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de&format=json`;

        fetch(geocodingUrl)
            .then(response => response.json())
            .then(data => {
                if (data.results && data.results.length > 0) {
                    const result = data.results[0];
                    loadWeather(result.latitude, result.longitude, result.name);
                    searchInput.value = ''; // Clear input
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
                searchButton.textContent = 'Suchen';
            });
    }

    function loadWeather(lat, lon, name) {
        // Update title
        cityNameDisplay.textContent = `${name} Wetter Vorschau`;
        document.title = `${name} Wetter Vorschau`;

        // Call functions from other scripts
        if (window.loadTemperatureData) {
            window.loadTemperatureData(lat, lon);
        }
        if (window.loadSolarData) {
            window.loadSolarData(lat, lon);
        }
    }
});
