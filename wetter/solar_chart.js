document.addEventListener("DOMContentLoaded", function() {
    const apiUrl = "https://api.open-meteo.com/v1/forecast?latitude=47.949&longitude=16.8417&hourly=global_tilted_irradiance&past_days=10&forecast_days=5";

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const hourlyGTI = data.hourly.global_tilted_irradiance; // Get the global tilted irradiance data
            const timeData = data.hourly.time; // Get the time data

            // Calculate daily kWh/m² from hourly GTI
            const dailyData = calculateDailySolarPower(timeData, hourlyGTI);
            console.log("Calculated daily data:", dailyData);

            // Print the calculated daily data in a table
            displayDailyDataTable(dailyData);

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

    // Replace displayDailyDataTable to use avg of expected range for %
    function displayDailyDataTable(dailyData) {
        const tableBody = document.querySelector("#solarTable tbody");
        // Update table header to include new column
        const tableHead = document.querySelector("#solarTable thead tr");
        if (tableHead.children.length < 3) {
            const percentTh = document.createElement("th");
            percentTh.textContent = "% des erwarteten Maximums";
            tableHead.appendChild(percentTh);
        }
        let percentSum = 0;
        let percentCount = 0;
        tableBody.innerHTML = ""; // Clear previous rows if any
        dailyData.forEach(data => {
            const row = document.createElement("tr");
            const dayCell = document.createElement("td");
            const kWhCell = document.createElement("td");
            const percentCell = document.createElement("td");
            // Format date as DD.MM.YYYY
            const dateObj = new Date(data.day);
            const month = dateObj.getMonth();
            const expectedMin = monthlyExpectedRanges[month].min;
            const expectedMax = monthlyExpectedRanges[month].max;
            const expectedAvg = (expectedMin + expectedMax) / 2;
            const percent = expectedAvg > 0 ? Math.round((data.kWh / expectedAvg) * 100) : 0;
            percentSum += percent;
            percentCount++;
            dayCell.textContent = dateObj.toLocaleDateString('de-AT');
            kWhCell.textContent = data.kWh;
            percentCell.textContent = percent + " %";
            row.appendChild(dayCell);
            row.appendChild(kWhCell);
            row.appendChild(percentCell);
            tableBody.appendChild(row);
        });

        // Add average % below the table
        let avgPercent = percentCount > 0 ? (percentSum / percentCount).toFixed(1) : "0";
        let avgDiv = document.getElementById("solarTableAvg");
        if (!avgDiv) {
            avgDiv = document.createElement("div");
            avgDiv.id = "solarTableAvg";
            avgDiv.style.textAlign = "center";
            avgDiv.style.marginTop = "8px";
            avgDiv.style.fontWeight = "bold";
            document.getElementById("solarTableContainer").appendChild(avgDiv);
        }
        avgDiv.textContent = `Durchschnitt: ${avgPercent} % des typ. Monatsertrags.`;
    }

    // 1. Monthly expected solar radiation ranges (kWh/m²/day)
    const monthlyExpectedRanges = {
        0: { min: 1.0, max: 1.3 },   // January
        1: { min: 1.5, max: 2.0 },   // February
        2: { min: 2.5, max: 3.0 },   // March
        3: { min: 3.5, max: 4.5 },   // April
        4: { min: 4.5, max: 5.5 },   // May
        5: { min: 5.5, max: 6.5 },   // June
        6: { min: 6.0, max: 6.5 },   // July
        7: { min: 5.0, max: 6.0 },   // August
        8: { min: 3.0, max: 4.0 },   // September
        9: { min: 2.0, max: 3.0 },   // October
        10: { min: 1.0, max: 1.5 },  // November
        11: { min: 0.8, max: 1.2 }   // December
    };

    function createDailySolarPowerChart(dailyData) {
        const days = dailyData.map(data => data.day);
        const kWhValues = dailyData.map(data => data.kWh);

        // 2. Prepare expected range bands for each day
        const expectedMin = [];
        const expectedMax = [];
        days.forEach(day => {
            const date = new Date(day);
            const month = date.getMonth();
            expectedMin.push(monthlyExpectedRanges[month].min);
            expectedMax.push(monthlyExpectedRanges[month].max);
        });

        // 3. ApexCharts supports range area via 'rangeBar' or 'area' with two series
        // We'll use a custom fill between two area series for the expected band

        const options = {
            series: [
                {
                    name: 'Tatsächlicher Solarertrag (kWh/m²)',
                    type: 'bar',
                    data: kWhValues
                },
                {
                    name: 'Erwarteter Bereich (Minimum)',
                    type: 'area',
                    data: expectedMin
                },
                {
                    name: 'Erwarteter Bereich (Maximum)',
                    type: 'area',
                    data: expectedMax
                }
            ],
            chart: {
                height: 350,
                type: 'line',
                stacked: false,
                toolbar: { show: false }
            },
            stroke: {
                width: [2, 0, 0],
                curve: 'smooth'
            },
            fill: {
                type: ['solid', 'gradient', 'gradient'],
                opacity: [1, 0.2, 0.2],
                gradient: {
                    shadeIntensity: 0.2,
                    inverseColors: false,
                    opacityFrom: 0.2,
                    opacityTo: 0.2,
                    stops: [0, 100]
                }
            },
            colors: ['#008FFB', '#B3E5FC', '#B3E5FC'],
            title: {
                text: 'Solar Ertrag (kWh/m²/Tag) mit Monatserwartung',
                align: 'center'
            },
            xaxis: {
                categories: days,
                title: { text: 'Tag' },
                labels: {
                    formatter: function(val) {
                        const date = new Date(val);
                        return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                    },
                    rotate: -45,
                    maxHeight: 70
                }
            },
            yaxis: {
                title: { text: 'Solar Ertrag (kWh/m²)' }
            },
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: function(val) {
                        return val ? val + " kWh/m²" : "";
                    }
                }
            },
            legend: {
                show: true,
                position: 'top'
            }
        };

        // 4. Custom rendering to fill between expectedMin and expectedMax
        // ApexCharts doesn't natively support area between two lines, but plotting both as area with same color/opacity gives a band effect

        const chart = new ApexCharts(document.querySelector("#solarChart"), options);
        chart.render();
    }
});
