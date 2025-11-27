window.loadSolarData = function (lat, lon, cityName) {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=global_tilted_irradiance&past_days=10&forecast_days=5`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const hourlyGTI = data.hourly.global_tilted_irradiance; // Get the global tilted irradiance data
            const timeData = data.hourly.time; // Get the time data

            // Calculate daily kWh/m² from hourly GTI
            const dailyData = calculateDailySolarPower(timeData, hourlyGTI);
            console.log("Calculated daily data:", dailyData);

            // Print the calculated daily data in a text list
            displayDailyData(dailyData);

            // Create the chart with calculated daily data
            createDailySolarPowerChart(dailyData, cityName);
        })
        .catch(error => console.error('Error fetching data:', error));
};

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
                console.log(`Day: ${currentDay}, kWh: ${dailyKWhValue}`);
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
        console.log(`Day: ${currentDay}, kWh: ${dailyKWhValue}`);
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
        listItem.innerHTML = `<strong>${dayName}</strong><br>${data.kWh} kWh`;
        container.appendChild(listItem);
    });
}

function createDailySolarPowerChart(dailyData, cityName) {
    if (window.solarChartInstance) {
        window.solarChartInstance.destroy();
    }

    const days = dailyData.map(data => data.day);
    const kWhValues = dailyData.map(data => data.kWh);

    const options = {

        series: [{
            name: 'Daily Solar Power (kWh/m²)',
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
                    position: 'top'
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
                text: 'Solar Power (kWh/m²)',
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
            theme: 'light'
        }
    };
    console.log(options); // Log the options before initializing the chart
    window.solarChartInstance = new ApexCharts(document.querySelector("#solarChart"), options);
    window.solarChartInstance.render();
}
