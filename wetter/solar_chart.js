document.addEventListener("DOMContentLoaded", function () {
    const apiUrl = "https://api.open-meteo.com/v1/forecast?latitude=47.949&longitude=16.8417&hourly=global_tilted_irradiance&past_days=10&forecast_days=5";

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
            createDailySolarPowerChart(dailyData);
        })
        .catch(error => console.error('Error fetching data:', error));

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
        dailyData.forEach(data => {
            const listItem = document.createElement("div");
            listItem.textContent = `Day: ${data.day}, kWh: ${data.kWh}`;
            container.appendChild(listItem);
        });
    }

    function createDailySolarPowerChart(dailyData) {
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
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    dataLabels: {
                        enabled: true,
                        enabledOnSeries: [1],
                        position: 'top'
                    }
                }
            },
            title: {
                text: 'Daily Solar Power Estimate (kWh/m²)',
                align: 'center'
            },
            xaxis: {
                categories: days,
                title: {
                    text: 'Day'
                },
                labels: {
                    formatter: function (val) {
                        const date = new Date(val);
                        return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                    },
                    rotate: -45,
                    maxHeight: 70
                }
            },
            yaxis: {
                title: {
                    text: 'Solar Power (kWh/m²)'
                }
            },


        };
        console.log(options); // Log the options before initializing the chart
        const chart = new ApexCharts(document.querySelector("#solarChart"), options);
        chart.render();
    }
});
