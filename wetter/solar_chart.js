let currentDailyData = [];
let currentCityName = '';

window.loadSolarData = function (lat, lon, cityName) {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=global_tilted_irradiance&past_days=7&forecast_days=5`;
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
        totalKWh: parseFloat((item.kWh * area * (efficiency / 100)).toFixed(1))
    }));

    displayDailyData(calculatedData);
    createDailySolarPowerChart(calculatedData, currentCityName, kwp);
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

function displayDailyData(dailyData) {
    const container = document.getElementById("dailyDataContainer");
    if (!container) return;
    container.innerHTML = '';

    // Sort to show today first if possible, or just latest. 
    // For now, keep the order but maybe highlight today.
    const todayStr = new Date().toISOString().split('T')[0];

    dailyData.forEach(data => {
        const isToday = data.day === todayStr;
        const listItem = document.createElement("div");
        if (isToday) listItem.style.borderColor = 'var(--accent)';

        const date = new Date(data.day);
        const dayName = date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' });

        listItem.innerHTML = `
            <strong>${dayName}</strong>
            <span>${data.totalKWh} kWh</span>
        `;
        container.appendChild(listItem);
    });
}

function createDailySolarPowerChart(dailyData, cityName, systemSize) {
    if (window.solarChartInstance) {
        window.solarChartInstance.destroy();
    }

    const days = dailyData.map(data => data.day);
    const kWhValues = dailyData.map(data => data.kWhPerM2);

    const style = getComputedStyle(document.documentElement);
    const sunColor = style.getPropertyValue('--sun').trim() || '#FDB813';
    const textMuted = style.getPropertyValue('--text-muted').trim() || '#64748b';

    const options = {
        series: [{
            name: 'Einstrahlung',
            data: kWhValues
        }],
        colors: [sunColor],
        chart: {
            type: 'bar',
            height: 400,
            fontFamily: 'Inter, sans-serif',
            toolbar: { show: false },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                borderRadius: 8,
                columnWidth: '60%',
                dataLabels: {
                    position: 'top'
                }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: (val) => val.toFixed(1),
            offsetY: -25,
            style: {
                fontSize: '11px',
                fontWeight: 700,
                colors: [textMuted]
            }
        },
        grid: {
            borderColor: 'rgba(0,0,0,0.05)',
            padding: { top: 20, bottom: 0, left: 20, right: 20 }
        },
        xaxis: {
            categories: days,
            labels: {
                formatter: (val) => {
                    const date = new Date(val);
                    return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' });
                },
                style: { colors: textMuted, fontSize: '11px' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            title: { text: 'kWh/m²', style: { color: textMuted, fontWeight: 600 } },
            labels: { style: { colors: textMuted } }
        },
        tooltip: {
            theme: 'light',
            y: {
                formatter: (val) => val + " kWh/m²"
            }
        }
    };

    window.solarChartInstance = new ApexCharts(document.querySelector("#solarChart"), options);
    window.solarChartInstance.render();
}
