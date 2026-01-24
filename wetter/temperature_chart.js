// Export the function so it can be used by other scripts
window.loadTemperatureData = function (lat, lon, cityName, duration = 4) {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,rain&past_days=1&forecast_days=${duration}`;

    const chartContainer = document.querySelector("#tempChart");
    if (chartContainer) chartContainer.classList.add('loading');


    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (chartContainer) chartContainer.classList.remove('loading');
            updateTempSummary(data.hourly.temperature_2m, data.hourly.rain);
            createTemperatureChart(data.hourly.time, data.hourly.temperature_2m, data.hourly.rain, cityName, duration);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            if (chartContainer) chartContainer.classList.remove('loading');
        });
};

function updateTempSummary(temps, rains) {
    const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
    const totalRain = rains.reduce((a, b) => a + b, 0).toFixed(1);
    const summarySpan = document.getElementById('temp-summary');
    if (summarySpan) {
        summarySpan.innerHTML = `Ø <strong>${avgTemp}</strong> °C • Total <strong>${totalRain}</strong> mm Regen`;
    }
}

function createTemperatureChart(timeData, tempData, rainData, cityName, duration) {
    if (window.tempChartInstance) {
        window.tempChartInstance.destroy();
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime() - 1;

    // Get colors from CSS variables
    const style = getComputedStyle(document.documentElement);
    const accentColor = style.getPropertyValue('--accent').trim() || '#3b82f6';
    const sunColor = style.getPropertyValue('--sun').trim() || '#FDB813';
    const textMain = style.getPropertyValue('--text-main').trim() || '#334155';
    const textMuted = style.getPropertyValue('--text-muted').trim() || '#64748b';

    const options = {
        series: [
            {
                name: 'Temperatur',
                type: 'line',
                data: tempData
            },
            {
                name: 'Regen',
                type: 'bar',
                data: rainData
            }
        ],
        colors: [sunColor, accentColor],
        chart: {
            height: 450,
            type: 'line',
            fontFamily: 'Outfit, sans-serif',
            toolbar: { show: false },
            zoom: { enabled: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 1000
            },
            dropShadow: {
                enabled: true,
                top: 10,
                left: 0,
                blur: 10,
                opacity: 0.05
            }
        },
        stroke: {
            curve: 'smooth',
            width: [4, 0],
            lineCap: 'round'
        },
        fill: {
            type: ['gradient', 'solid'],
            gradient: {
                shade: 'light',
                type: "vertical",
                shadeIntensity: 0.5,
                gradientToColors: [sunColor],
                inverseColors: true,
                opacityFrom: 0.7,
                opacityTo: 0.9,
                stops: [0, 100]
            }
        },
        annotations: {
            xaxis: generateMidnightAnnotations(timeData).concat([
                {
                    x: todayStart,
                    x2: todayEnd,
                    fillColor: accentColor,
                    opacity: 0.05,
                    borderWidth: 0,
                    label: {
                        text: 'HEUTE',
                        style: {
                            color: accentColor,
                            background: 'transparent',
                            fontSize: '10px',
                            fontWeight: 800
                        },
                        offsetY: -10,
                        orientation: 'horizontal'
                    }
                },
                {
                    x: new Date().getTime(),
                    borderColor: accentColor,
                    strokeDashArray: 2
                }
            ]),
            yaxis: [
                {
                    y: 0,
                    borderColor: '#cbd5e1',
                    borderWidth: 1,
                    strokeDashArray: 0,
                    label: {
                        borderColor: 'transparent',
                        style: {
                            color: '#64748b',
                            background: 'transparent',
                            fontSize: '10px',
                            fontWeight: 700
                        },
                        text: '0°C',
                        position: 'left',
                        offsetX: -10
                    }
                }
            ]
        },
        grid: {
            borderColor: 'rgba(0,0,0,0.03)',
            strokeDashArray: 2,
            padding: { top: 20, bottom: 20, left: 10, right: 10 },
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } }
        },
        xaxis: {
            type: 'datetime',
            categories: timeData,
            labels: {
                style: { colors: textMuted, fontSize: '11px', fontWeight: 600, fontFamily: 'Outfit' },
                datetimeUTC: false,
                minHeight: 45,
                formatter: function (val, timestamp) {
                    const date = new Date(timestamp);
                    // Force display of day labels at the transition of each day
                    const day = date.toLocaleDateString('de-DE', { weekday: 'short' });
                    const datePart = date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
                    return [day, datePart];
                }
            },
            tickAmount: duration, // One tick per day
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: [
            {
                title: { text: 'Temp (°C)', style: { color: textMuted, fontWeight: 600 } },
                labels: { style: { colors: textMuted } }
            },
            {
                opposite: true,
                title: { text: 'Regen (mm)', style: { color: textMuted, fontWeight: 600 } },
                labels: { style: { colors: textMuted } }
            }
        ],
        tooltip: {
            theme: 'light',
            x: { format: 'dd. MMM HH:mm' },
            shared: true,
            intersect: false,
            y: {
                formatter: function (val, { seriesIndex }) {
                    return val + (seriesIndex === 0 ? " °C" : " mm");
                }
            }
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            fontSize: '14px',
            fontWeight: 500,
            markers: { radius: 12 }
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
                borderColor: 'rgba(0,0,0,0.1)',
                strokeDashArray: 4
            });
            lastDate = datePart;
        }
    });
    return annotations;
}


