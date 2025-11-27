document.addEventListener("DOMContentLoaded", function () {
    const apiUrl = "https://api.open-meteo.com/v1/forecast?latitude=47.949&longitude=16.8417&hourly=temperature_2m,rain&past_days=2&forecast_days=4";

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            createTemperatureChart(data.hourly.time, data.hourly.temperature_2m, data.hourly.rain);
        })
        .catch(error => console.error('Error fetching data:', error));

    function createTemperatureChart(timeData, tempData, rainData) {
        var today = new Date();
        var todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime(); // Start of today
        var todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime() - 1; // End of today

        var futureTimes = timeData.map(time => new Date(time).getTime() > today.getTime());

        var options = {
            series: [
                {
                    name: 'Hourly Temperature (°C)',
                    type: 'line',
                    data: tempData,
                    color: '#FFA500', // Set the color of the temperature line to orange
                    stroke: {
                        width: 0.5, // Set the stroke width to half of the default
                        curve: 'smooth' // Set the curve type to smooth
                    }
                },
                {
                    name: 'Hourly Rainfall (mm)',
                    type: 'bar',
                    data: rainData,
                    color: '#1E90FF' // Set the color of the rain bars to blue
                }
            ],
            chart: {
                height: 350,
                type: 'line'
            },
            stroke: {
                curve: 'smooth',
                dashArray: futureTimes // Apply dashed line for future times
            },
            annotations: {
                xaxis: generateMidnightAnnotations(timeData).concat([
                    {
                        x: todayStart,
                        x2: todayEnd,
                        fillColor: '#B3F7CA',
                        opacity: 0.4,
                        label: {
                            borderColor: '#B3F7CA',
                            style: {
                                fontSize: '10px',
                                color: '#fff',
                                background: '#00E396',
                            },
                            offsetY: -10,
                            text: 'Today'
                        }
                    },
                    ...generateDayLabels(timeData)
                ])
            },
            grid: {
                row: {
                    colors: ['#f3f3f3', 'transparent'], // alternating colors for rows
                    opacity: 0.5
                },
            },
            title: {
                text: 'Hourly Temperature and Rainfall Data for Neusiedl am See',
                align: 'center'
            },
            xaxis: {
                type: 'datetime',
                categories: timeData,
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    type: 'vertical', // Changing the gradient direction to vertical
                    inverseColors: true, // Flipping the color order to correctly map to the temperature range
                    opacityFrom: 0.7,
                    opacityTo: 0.9,
                    stops: [0, 100]
                }
            },
            yaxis: [
                {
                    title: {
                        text: 'Temperature (°C)'
                    },
                },
                {
                    opposite: true,
                    title: {
                        text: 'Rainfall (mm)'
                    }
                }
            ],
            tooltip: {
                x: {
                    format: 'dd MMM yyyy HH:mm'
                }
            },
            dataLabels: {
                enabled: false // Disable data labels
            }
        };

        var chart = new ApexCharts(document.querySelector("#tempChart"), options);
        chart.render();
    }

    function generateMidnightAnnotations(timeData) {
        let annotations = [];
        let lastDate = '';
        timeData.forEach(time => {
            const datePart = time.split('T')[0];
            if (datePart !== lastDate) {
                annotations.push({
                    x: new Date(datePart + 'T00:00').getTime(),
                    borderColor: '#775DD0',
                    label: {
                        borderColor: '#775DD0',
                        style: {
                            color: '#fff',
                            background: '#775DD0'
                        },
                    }
                });
                lastDate = datePart;
            }
        });
        return annotations;
    }

    function generateDayLabels(timeData) {
        let labels = [];
        let lastDate = '';
        timeData.forEach(time => {
            const datePart = time.split('T')[0];
            const dateObj = new Date(datePart);
            const dayName = dateObj.toLocaleString('de-DE', { weekday: 'long' });

            if (datePart !== lastDate) {
                const midpoint = dateObj.getTime() + (12 * 60 * 60 * 1000); // Calculate midpoint of the day
                labels.push({
                    x: midpoint,
                    borderColor: 'transparent',
                    label: {
                        style: {
                            color: '#000000', // Change text color to black for visibility
                            background: 'transparent',
                            fontSize: '12px'
                        },
                        text: dayName,
                        orientation: 'horizontal',
                        offsetY: -20, // Position the day label above the chart
                    }
                });
                lastDate = datePart;
            }
        });
        return labels;
    }
});
