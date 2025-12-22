let currentDailyData = [];
let currentCityName = '';

window.loadSolarData = function (lat, lon, cityName) {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=global_tilted_irradiance&past_days=10&forecast_days=5`;
    currentCityName = cityName;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const hourlyGTI = data.hourly.global_tilted_irradiance; // Get the global tilted irradiance data
            const timeData = data.hourly.time; // Get the time data

            // Calculate daily kWh/m² from hourly GTI
            currentDailyData = calculateDailySolarPower(timeData, hourlyGTI);
            console.log("Calculated daily data:", currentDailyData);

            updateSolarUI();
        })
        .catch(error => console.error('Error fetching data:', error));
};

// Event listener for inputs
document.addEventListener("DOMContentLoaded", function () {
    const roofAreaInput = document.getElementById('roofArea');
    const efficiencyInput = document.getElementById('efficiency');

    if (roofAreaInput && efficiencyInput) {
        roofAreaInput.addEventListener('input', updateSolarUI);
        efficiencyInput.addEventListener('input', updateSolarUI);
    }
});

function updateSolarUI() {
    if (!currentDailyData || currentDailyData.length === 0) return;

    const roofAreaInput = document.getElementById('roofArea');
    const efficiencyInput = document.getElementById('efficiency');
    const kwpDisplay = document.getElementById('kwpDisplay');

    const area = parseFloat(roofAreaInput ? roofAreaInput.value : 0) || 57;
    const efficiency = parseFloat(efficiencyInput ? efficiencyInput.value : 0) || 17.5;

    // Calculate kWp for display
    // kWp = Area (m²) * 1 kW/m² * Efficiency
    const kwp = (area * (efficiency / 100)).toFixed(1);
    if (kwpDisplay) {
        kwpDisplay.textContent = `${kwp} kWp`;
    }

    // Calculate total energy based on Area and Efficiency
    // Energy (kWh) = Irradiance (kWh/m²) * Area (m²) * Efficiency

    const calculatedData = currentDailyData.map(item => ({
        day: item.day,
        kWhPerM2: item.kWh,
        totalKWh: parseFloat((item.kWh * area * (efficiency / 100)).toFixed(1))
    }));

    // Print the calculated daily data in a text list (Energy Production)
    displayDailyData(calculatedData);

    // Create the chart with raw irradiance data (kWh/m²)
    createDailySolarPowerChart(calculatedData, currentCityName, kwp);
}

function calculateDailySolarPower(timeData, gtiData) {
    let dailyKWh = [];
    let currentDay = "";
    let dailySum = 0;

    timeData.forEach((time, index) => {
        const day = time.split("T")[0];
        const gtiValue = gtiData[index];

        if (day !== currentDay) {
            if (currentDay !== "") {
                const dailyKWhValue = parseFloat((dailySum / 1000).toFixed(1)); // Convert Wh/m² to kWh/m²
                dailyKWh.push({ day: currentDay, kWh: dailyKWhValue });
            }
            currentDay = day;
            dailySum = 0;
        }

        dailySum += gtiValue; // Sum up hourly GTI values
    });

    // Add the last day's data
    if (currentDay !== "") {
        const dailyKWhValue = parseFloat((dailySum / 1000).toFixed(1));
        dailyKWh.push({ day: currentDay, kWh: dailyKWhValue });
    }

    return dailyKWh;
}

function displayDailyData(dailyData) {
    const container = document.getElementById("dailyDataContainer");
    container.innerHTML = ''; // Clear previous data
    dailyData.forEach(data => {
        const listItem = document.createElement("div");
        const date = new Date(data.day);
        const dayName = date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' });
        // Display calculated Energy (totalKWh)
        listItem.innerHTML = `<strong>${dayName}</strong><br>${data.totalKWh} kWh`;
        container.appendChild(listItem);
    });
}

function createDailySolarPowerChart(dailyData, cityName, systemSize) {
    if (window.solarChartInstance) {
        window.solarChartInstance.destroy();
    }

    const days = dailyData.map(data => data.day);
    // Use kWhPerM2 for the chart
    const kWhValues = dailyData.map(data => data.kWhPerM2);

    const options = {

        series: [{
            name: 'Einstrahlung (kWh/m²)',
            data: kWhValues
        }],
        chart: {
            type: 'bar',
            height: 350,
            fontFamily: 'Inter, sans-serif',
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                borderRadius: 4,
                dataLabels: {
                    enabled: true,
                    enabledOnSeries: [1],
                    position: 'top',
                    formatter: function (val) {
                        return val;
                    },
                    style: {
                        fontSize: '10px',
                        colors: ["#334155"]
                    },
                    offsetY: -20
                }
            }
        },
        title: {
            text: cityName ? `Sonnenenergie in ${cityName}` : '',
            align: 'center',
            style: {
                fontSize: '14px',
                fontWeight: 600,
                color: '#64748b'
            }
        },
        xaxis: {
            categories: days,
            title: {
                text: ''
            },
            labels: {
                formatter: function (val) {
                    const date = new Date(val);
                    return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' });
                },
                rotate: -45,
                maxHeight: 70,
                style: {
                    colors: '#64748b',
                    fontSize: '12px'
                }
            },
            axisBorder: {
                show: false
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            title: {
                text: 'Einstrahlung (kWh/m²)',
                style: {
                    color: '#64748b'
                }
            },
            labels: {
                style: {
                    colors: '#64748b'
                }
            }
        },
        grid: {
            borderColor: '#f1f1f1',
        },
        colors: ['#FDB813'], // Sun color
        tooltip: {
            theme: 'light',
            y: {
                formatter: function (val) {
                    return val + " kWh/m²";
                }
            }
        }
    };
    window.solarChartInstance = new ApexCharts(document.querySelector("#solarChart"), options);
    window.solarChartInstance.render();
}
