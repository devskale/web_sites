// Export the function so it can be used by other scripts
window.loadTemperatureData = function (lat, lon) {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,rain&past_days=2&forecast_days=4`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            createTemperatureChart(data.hourly.time, data.hourly.temperature_2m, data.hourly.rain);
        })
        .catch(error => console.error('Error fetching data:', error));
};

function createTemperatureChart(timeData, tempData, rainData) {
    // Destroy existing chart if it exists to avoid duplicates/overlaps
    if (window.tempChartInstance) {
        window.tempChartInstance.destroy();
    }

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
                    width: 2, // Slightly thicker for better visibility
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
            type: 'line',
            fontFamily: 'Inter, sans-serif',
            toolbar: {
                show: false
            }
        },
        stroke: {
            curve: 'smooth',
            width: [2, 0],
            dashArray: [0, 0] // Removed dashed line for future times for cleaner look, or keep if preferred. Let's keep it simple.
        },
        annotations: {
            xaxis: generateMidnightAnnotations(timeData).concat([
                {
                    x: todayStart,
                    x2: todayEnd,
                    fillColor: '#B3F7CA',
                    opacity: 0.2,
                    label: {
                        borderColor: 'transparent',
                        style: {
                            fontSize: '10px',
                            color: '#008FFB',
                            background: 'transparent',
                        },
                        offsetY: -10,
                        text: ''
                    }
                },
                ...generateDayLabels(timeData)
            ])
        },
        grid: {
            borderColor: '#f1f1f1',
            row: {
                colors: ['transparent', 'transparent'],
                opacity: 0.5
            },
        },
        title: {
            text: '', // Removed title from chart itself for cleaner look
            align: 'left'
        },
        xaxis: {
            type: 'datetime',
            categories: timeData,
            labels: {
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
        fill: {
            type: ['solid', 'solid'],
            opacity: [1, 1]
        },
        yaxis: [
            {
                title: {
                    text: 'Temperature (°C)',
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
            {
                opposite: true,
                title: {
                    text: 'Rainfall (mm)',
                    style: {
                        color: '#64748b'
                    }
                },
                labels: {
                    style: {
                        colors: '#64748b'
                    }
                }
            }
        ],
        tooltip: {
            theme: 'light',
            x: {
                format: 'dd MMM HH:mm'
            }
        },
        dataLabels: {
            enabled: false // Disable data labels
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right'
        }
    };

    window.tempChartInstance = new ApexCharts(document.querySelector("#tempChart"), options);
    window.tempChartInstance.render();
}

function generateMidnightAnnotations(timeData) {
    let annotations = [];
    let lastDate = '';
    timeData.forEach(time => {
        const datePart = time.split('T')[0];
        if (datePart !== lastDate) {
            annotations.push({
                x: new Date(datePart + 'T00:00').getTime(),
                borderColor: '#e2e8f0',
                strokeDashArray: 4,
                label: {
                    borderColor: 'transparent',
                    style: {
                        color: '#fff',
                        background: 'transparent'
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
        const dayName = dateObj.toLocaleString('de-DE', { weekday: 'short' });

        if (datePart !== lastDate) {
            const midpoint = dateObj.getTime() + (12 * 60 * 60 * 1000); // Calculate midpoint of the day
            labels.push({
                x: midpoint,
                borderColor: 'transparent',
                label: {
                    style: {
                        color: '#64748b', // Change text color to black for visibility
                        background: 'transparent',
                        fontSize: '12px',
                        fontWeight: 600
                    },
                    text: dayName,
                    orientation: 'horizontal',
                    offsetY: -10, // Position the day label above the chart
                }
            });
            lastDate = datePart;
        }
    });
    return labels;
}
