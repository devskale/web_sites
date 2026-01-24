document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById('cityInput');
    const searchButton = document.getElementById('searchButton');
    const cityNameDisplay = document.getElementById('cityName');
    const btnText = searchButton.querySelector('.btn-text');

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
                if (btnText) btnText.textContent = 'Suchen';
                if (container) container.style.opacity = '1';
            });
    }

    function loadWeather(lat, lon, name) {
        // Update title with animation feel
        cityNameDisplay.style.opacity = '0';
        setTimeout(() => {
            cityNameDisplay.textContent = name;
            cityNameDisplay.style.transition = 'opacity 0.5s ease-in-out';
            cityNameDisplay.style.opacity = '1';
            document.title = `${name} | Wetter Vorschau`;
        }, 200);

        // Call functions from other scripts
        if (window.loadTemperatureData) {
            window.loadTemperatureData(lat, lon, name);
        }
        if (window.loadSolarData) {
            window.loadSolarData(lat, lon, name);
        }
    }
});
