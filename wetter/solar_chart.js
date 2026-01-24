let currentDailyData = [];
let currentCityName = '';

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function getConsumptionEstimate(dateStr) {
    const date = new Date(dateStr);
    const month = date.getMonth(); // 0-11

    // Use data from consumption_data.js if available
    const monthlyTotal = (window.CONSUMPTION_DATA && window.CONSUMPTION_DATA[month])
        ? window.CONSUMPTION_DATA[month].total
        : 800; // Default fallback

    const days = DAYS_IN_MONTH[month];
    return monthlyTotal / days;
}

window.loadSolarData = function (lat, lon, cityName, duration = 4) {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=global_tilted_irradiance&past_days=1&forecast_days=${duration}`;
    currentCityName = cityName;

    const chartContainer = document.querySelector("#solarChart");
    if (chartContainer) chartContainer.classList.add('loading');


    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (chartContainer) chartContainer.classList.remove('loading');
            const hourlyGTI = data.hourly.global_tilted_irradiance;
            const timeData = data.hourly.time;

            currentDailyData = calculateDailySolarPower(timeData, hourlyGTI);
            updateSolarUI();
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            if (chartContainer) chartContainer.classList.remove('loading');
        });
};

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

    const kwp = (area * (efficiency / 100)).toFixed(1);
    if (kwpDisplay) {
        kwpDisplay.textContent = `${kwp} kWp`;
    }

    const calculatedData = currentDailyData.map(item => ({
        day: item.day,
        kWhPerM2: item.kWh,
        totalKWh: parseFloat((item.kWh * area * (efficiency / 100)).toFixed(1)),
        consumptionKWh: parseFloat(getConsumptionEstimate(item.day).toFixed(1))
    }));

    updateSolarSummary(calculatedData);
    createDailySolarPowerChart(calculatedData, currentCityName);
}

function updateSolarSummary(data) {
    const totalErtrag = data.reduce((acc, curr) => acc + curr.totalKWh, 0).toFixed(0);
    const avgErtrag = (totalErtrag / data.length).toFixed(1);

    const totalVerbrauch = data.reduce((acc, curr) => acc + curr.consumptionKWh, 0);
    const avgVerbrauch = (totalVerbrauch / data.length).toFixed(1);

    const summarySpan = document.getElementById('solar-summary');
    if (summarySpan) {
        summarySpan.innerHTML = `
            Ertrag Ø <strong>${avgErtrag}</strong> kWh/Tag • Total <strong>${totalErtrag}</strong> kWh<br>
            Verbrauch Ø <strong>${avgVerbrauch}</strong> kWh/Tag
        `;
    }
}

function calculateDailySolarPower(timeData, gtiData) {
    let dailyKWh = [];
    let currentDay = "";
    let dailySum = 0;

    timeData.forEach((time, index) => {
        const day = time.split("T")[0];
        const gtiValue = gtiData[index] || 0;

        if (day !== currentDay) {
            if (currentDay !== "") {
                const dailyKWhValue = parseFloat((dailySum / 1000).toFixed(1));
                dailyKWh.push({ day: currentDay, kWh: dailyKWhValue });
            }
            currentDay = day;
            dailySum = 0;
        }
        dailySum += gtiValue;
    });

    if (currentDay !== "") {
        const dailyKWhValue = parseFloat((dailySum / 1000).toFixed(1));
        dailyKWh.push({ day: currentDay, kWh: dailyKWhValue });
    }

    return dailyKWh;
}

// displayDailyData removed for compactness

function createDailySolarPowerChart(dailyData, cityName) {
    if (window.solarChartInstance) {
        window.solarChartInstance.destroy();
    }

    const days = dailyData.map(data => data.day);
    const productionValues = dailyData.map(data => data.totalKWh);
    const consumptionValues = dailyData.map(data => data.consumptionKWh);

    const style = getComputedStyle(document.documentElement);
    const sunColor = style.getPropertyValue('--sun').trim() || '#FDB813';
    const accentColor = style.getPropertyValue('--accent').trim() || '#3b82f6';
    const textMuted = style.getPropertyValue('--text-muted').trim() || '#64748b';

    const options = {
        series: [
            {
                name: 'Ertrag',
                type: 'bar',
                data: productionValues
            },
            {
                name: 'Verbrauch',
                type: 'line',
                data: consumptionValues
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
            width: [0, 4],
            curve: 'smooth',
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
                opacityFrom: 0.85,
                opacityTo: 0.95,
                stops: [0, 100]
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                borderRadius: 4,
                columnWidth: '60%',
                dataLabels: {
                    position: 'top'
                }
            }
        },
        dataLabels: {
            enabled: false
        },
        grid: {
            borderColor: 'rgba(0,0,0,0.03)',
            strokeDashArray: 2,
            padding: { top: 20, bottom: 20, left: 10, right: 10 },
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } }
        },
        xaxis: {
            type: 'category',
            categories: days,
            labels: {
                style: { colors: textMuted, fontSize: '11px', fontWeight: 600, fontFamily: 'Outfit' },
                minHeight: 45,
                formatter: (val) => {
                    const date = new Date(val);
                    const day = date.toLocaleDateString('de-DE', { weekday: 'short' });
                    const datePart = date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
                    return [day, datePart];
                }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            title: {
                text: 'Energie (kWh)',
                style: { color: textMuted, fontWeight: 600 }
            },
            labels: {
                style: { colors: textMuted }
            }
        },
        tooltip: {
            theme: 'light',
            y: {
                formatter: (val) => val.toFixed(1) + " kWh"
            }
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
            fontSize: '14px',
            fontWeight: 500,
            markers: { radius: 12 }
        }
    };

    window.solarChartInstance = new ApexCharts(document.querySelector("#solarChart"), options);
    window.solarChartInstance.render();
}
