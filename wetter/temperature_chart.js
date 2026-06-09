// ========== Timezone-safe helpers ==========
//
// Open-Meteo with timezone=auto returns times in the LOCATION's local timezone,
// e.g. "2026-06-09T15:15" means 3:15 PM Vienna time.
// We parse these manually into true UTC epoch milliseconds so ApexCharts
// displays them identically for viewers anywhere on Earth.

/**
 * Parse an Open-Meteo time string ("2026-06-09T15:15") as location-local
 * and return the equivalent UTC epoch ms.
 */
function toLocationMs(timeStr, offsetSec) {
    const dp = timeStr.split('T')[0].split('-').map(Number);  // [Y, M, D]
    const tp = (timeStr.split('T')[1] || '00:00').split(':').map(Number); // [H, m]
    // Date.UTC treats args as UTC → subtract location offset to get true UTC
    return Date.UTC(dp[0], dp[1] - 1, dp[2], tp[0], tp[1] || 0) - offsetSec * 1000;
}

/** Epoch ms of midnight (00:00) for a YYYY-MM-DD in the location's timezone */
function locationMidnight(dateStr, offsetSec) {
    return toLocationMs(dateStr + 'T00:00', offsetSec);
}

/** {start, end} epoch ms of "today" in the location's timezone */
function locationTodayRange(offsetSec) {
    const now = Date.now();                                    // true UTC epoch
    const loc = new Date(now + offsetSec * 1000);              // shift into loc tz
    const y = loc.getUTCFullYear(), m = loc.getUTCMonth(), d = loc.getUTCDate();
    const start = Date.UTC(y, m, d) - offsetSec * 1000;        // midnight loc-tz → UTC
    return { start, end: start + 86399999 };
}


// ========== Temperature chart ==========
window.loadTemperatureData = function (lat, lon, cityName, duration = 4) {
    const chartEl = document.querySelector("#tempChart");
    const loadingEl = document.getElementById('tempChartLoading');
    const errorEl = document.getElementById('tempChartError');

    if (chartEl) chartEl.style.display = 'none';
    if (loadingEl) loadingEl.classList.add('active');
    if (errorEl) errorEl.classList.remove('active');

    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,rain&past_days=1&forecast_days=${duration}&timezone=auto`;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!data.hourly || !data.hourly.time) throw new Error('Invalid data');

            if (loadingEl) loadingEl.classList.remove('active');
            if (chartEl) chartEl.style.display = '';

            const offsetSec = data.utc_offset_seconds || 0;
            updateTempSummary(data.hourly.temperature_2m, data.hourly.rain);
            createTemperatureChart(
                data.hourly.time, data.hourly.temperature_2m, data.hourly.rain,
                cityName, duration, offsetSec
            );
        })
        .catch(error => {
            console.error('Error fetching temp data:', error);
            if (loadingEl) loadingEl.classList.remove('active');
            if (errorEl) errorEl.classList.add('active');
            if (chartEl) chartEl.style.display = '';
        });
};

function updateTempSummary(temps, rains) {
    const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
    const totalRain = rains.reduce((a, b) => a + b, 0).toFixed(1);
    const maxTemp = Math.max(...temps).toFixed(1);
    const minTemp = Math.min(...temps).toFixed(1);

    const el = document.getElementById('temp-summary');
    if (el) {
        el.innerHTML = `Ø <strong>${avgTemp}</strong> °C • <strong>${minTemp}</strong> – <strong>${maxTemp}</strong> °C • Total <strong>${totalRain}</strong> mm Regen`;
    }
}

/** Format an epoch-ms value for display in the location's timezone */
function formatLocTime(epochMs, offsetSec) {
    const d = new Date(epochMs + offsetSec * 1000);   // shift → loc tz, read as UTC
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const MO = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
    return `${dd}. ${MO[d.getUTCMonth()]} ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`;
}

function formatLocDateShort(epochMs, offsetSec) {
    const d = new Date(epochMs + offsetSec * 1000);
    const day = ['So','Mo','Di','Mi','Do','Fr','Sa'][d.getUTCDay()];
    const dd = d.getUTCDate();
    const MO = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
    return [day, `${dd}. ${MO[d.getUTCMonth()]}`];
}

function createTemperatureChart(timeData, tempData, rainData, cityName, duration, offsetSec) {
    if (window.tempChartInstance) window.tempChartInstance.destroy();

    // Convert all time strings → true UTC epochs
    const epochs = timeData.map(t => toLocationMs(t, offsetSec));
    const { start: todayStart, end: todayEnd } = locationTodayRange(offsetSec);

    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue('--accent').trim() || '#3b82f6';
    const sun   = style.getPropertyValue('--sun').trim() || '#FDB813';
    const muted = style.getPropertyValue('--text-muted').trim() || '#64748b';

    const options = {
        series: [
            { name: 'Temperatur', type: 'line', data: tempData },
            { name: 'Regen',     type: 'bar',  data: rainData }
        ],
        colors: [sun, accent],
        chart: {
            height: window.innerWidth < 600 ? 320 : 400,
            type: 'line',
            fontFamily: 'Outfit, sans-serif',
            toolbar: { show: false },
            zoom: { enabled: false },
            animations: { enabled: true, easing: 'easeinout', speed: 900 },
            dropShadow: { enabled: true, top: 8, left: 0, blur: 8, opacity: 0.04 }
        },
        stroke: { curve: 'smooth', width: [3, 0], lineCap: 'round' },
        fill: {
            type: ['gradient', 'solid'],
            gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.5,
                        gradientToColors: [sun], inverseColors: true,
                        opacityFrom: 0.65, opacityTo: 0.9, stops: [0, 100] }
        },
        annotations: {
            xaxis: generateMidnightAnnotations(timeData, offsetSec).concat([
                {
                    x: todayStart, x2: todayEnd,
                    fillColor: accent, opacity: 0.05, borderWidth: 0,
                    label: { text: 'HEUTE',
                             style: { color: accent, background: 'transparent', fontSize: '10px', fontWeight: 800 },
                             offsetY: -10, orientation: 'horizontal' }
                },
                { x: Date.now(), borderColor: accent, strokeDashArray: 3, strokeWidth: 1 }
            ]),
            yaxis: [{
                y: 0, borderColor: '#cbd5e1', borderWidth: 1,
                label: { borderColor: 'transparent',
                         style: { color: '#94a3b8', background: 'transparent', fontSize: '10px', fontWeight: 700 },
                         text: '0°C', position: 'left', offsetX: -10 }
            }]
        },
        grid: {
            borderColor: 'rgba(0,0,0,0.03)', strokeDashArray: 2,
            padding: { top: 16, bottom: 16, left: 8, right: 8 },
            xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } }
        },
        xaxis: {
            type: 'datetime',
            categories: epochs,
            labels: {
                style: { colors: muted, fontSize: '11px', fontWeight: 600, fontFamily: 'Outfit' },
                datetimeUTC: true,          // our epochs are true UTC
                minHeight: 42,
                formatter: (val) => formatLocDateShort(val, offsetSec)
            },
            tickAmount: duration,
            axisBorder: { show: false }, axisTicks: { show: false }
        },
        yaxis: [
            { title: { text: 'Temp (°C)', style: { color: muted, fontWeight: 600 } },
              labels: { style: { colors: muted } } },
            { opposite: true,
              title: { text: 'Regen (mm)', style: { color: muted, fontWeight: 600 } },
              labels: { style: { colors: muted } } }
        ],
        tooltip: {
            theme: 'light',
            x: { formatter: (val) => formatLocTime(val, offsetSec) },
            shared: true, intersect: false,
            y: { formatter: (v, { seriesIndex }) => v + (seriesIndex === 0 ? ' °C' : ' mm') }
        },
        legend: { position: 'top', horizontalAlign: 'right',
                  fontSize: '13px', fontWeight: 500, markers: { radius: 12 } }
    };

    window.tempChartInstance = new ApexCharts(document.querySelector('#tempChart'), options);
    window.tempChartInstance.render();
}

function generateMidnightAnnotations(timeData, offsetSec) {
    const ann = [];
    let last = '';
    for (const t of timeData) {
        const d = t.split('T')[0];
        if (d !== last) {
            ann.push({ x: locationMidnight(d, offsetSec), borderColor: 'rgba(0,0,0,0.08)', strokeDashArray: 4 });
            last = d;
        }
    }
    return ann;
}
