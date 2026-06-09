let currentSolarData = [];       // { time, gti } hourly raw
let currentCityName = '';
let _solarLat, _solarLon, _solarDuration;

// ─── Default PV setup ──────────────────────────────────────
const DEFAULT_KWP = 10;
const PV_TILT = 35;      // optimal for Austria ~47°N
const PV_AZIMUTH = 180;  // due south
const EUR_PER_KWH = 0.10; // rough Austrian feed-in / self-consumption savings

// ─── Load solar data from Open-Meteo ────────────────────────
window.loadSolarData = function (lat, lon, cityName, duration = 4) {
    _solarLat = lat; _solarLon = lon; _solarDuration = duration;
    currentCityName = cityName;

    const chartEl = document.querySelector("#solarChart");
    const loadingEl = document.getElementById('solarChartLoading');
    const errorEl = document.getElementById('solarChartError');

    if (chartEl) chartEl.style.display = 'none';
    if (loadingEl) loadingEl.classList.add('active');
    if (errorEl) errorEl.classList.remove('active');

    // Fetch GTI + shortwave radiation for quality check
    const apiUrl =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&hourly=global_tilted_irradiance,shortwave_radiation` +
        `&past_days=1&forecast_days=${duration}` +
        `&tilt=${PV_TILT}&azimuth=${PV_AZIMUTH}` +
        `&timezone=auto`;

    fetch(apiUrl)
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(data => {
            if (!data.hourly || !data.hourly.time) throw new Error('Invalid data');

            if (loadingEl) loadingEl.classList.remove('active');
            if (chartEl) chartEl.style.display = '';

            currentSolarData = data.hourly.time.map((t, i) => ({
                time: t,
                gti: data.hourly.global_tilted_irradiance[i] || 0,
                sw:  data.hourly.shortwave_radiation[i] || 0
            }));

            updateSolarUI();
        })
        .catch(err => {
            console.error('Solar fetch error:', err);
            if (loadingEl) loadingEl.classList.remove('active');
            if (errorEl) errorEl.classList.add('active');
            if (chartEl) chartEl.style.display = '';
        });
};

// ─── UI event wiring ────────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
    const kwpInput = document.getElementById('kwpInput');

    if (kwpInput) {
        kwpInput.addEventListener('input', debounce(updateSolarUI, 150));
    }
});

function debounce(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// ─── Core calc: GTI (W/m²) + kWp → instantaneous kW ────────
function gtiToKw(gtiWm2, kwp) {
    // kWp defined at STC = 1000 W/m². Linear scaling.
    return (gtiWm2 / 1000) * kwp;
}

// ─── Main UI refresh ─────────────────────────────────────────
function updateSolarUI() {
    if (!currentSolarData || currentSolarData.length === 0) return;

    const kwp = parseFloat(document.getElementById('kwpInput')?.value) || DEFAULT_KWP;

    // Enrich hourly data with computed power
    const hourly = currentSolarData.map(d => ({
        ...d,
        kw: gtiToKw(d.gti, kwp),
        kwh: (gtiToKw(d.gti, kwp) / 1000) // integrate over 1h → kWh (approximate midpoint)
    }));

    // Aggregate daily
    const daily = aggregateDaily(hourly);

    // Update summary
    updateSolarSummary(hourly, daily, kwp);

    // Render chart
    createSolarChart(hourly, daily, kwp);
}

// ─── Daily aggregation ──────────────────────────────────────
function aggregateDaily(hourly) {
    const map = new Map();
    for (const h of hourly) {
        const day = h.time.split('T')[0];
        if (!map.has(day)) map.set(day, { day, kwhTotal: 0, peakKw: 0, hours: 0 });
        const e = map.get(day);
        e.kwhTotal += h.kw;               // each entry = 1h slice → sum kW·h ≈ kWh
        e.peakKw = Math.max(e.peakKw, h.kw);
        if (h.kw > 0.05) e.hours++;       // count productive hours (>50W)
    }
    return Array.from(map.values());
}

// ─── Summary text ───────────────────────────────────────────
function updateSolarSummary(hourly, daily, kwp) {
    // Use "today" = last day in forecast (most relevant)
    const today = daily[daily.length - 1];
    if (!today) return;

    const specYield = (today.kwhTotal / kwp).toFixed(1);           // kWh/kWp today
    const avgSpecYield = (daily.reduce((s, d) => s + d.kwhTotal / kwp, 0) / daily.length).toFixed(1);
    const totalKwh = today.kwhTotal.toFixed(0);
    const peakKw = today.peakKw.toFixed(1);
    const eurSavings = (today.kwhTotal * EUR_PER_KWH).toFixed(1);

    const el = document.getElementById('solar-summary');
    if (el) {
        el.innerHTML = `
            Heute <strong>${totalKwh}</strong> kWh • Spitze <strong>${peakKw}</strong> kW •
            <strong>${specYield}</strong> kWh/kWp • ≈ <strong>${eurSavings} €</strong>
        `;
    }

    // Update metric cards below chart
    updateMetricCards(daily, kwp);
}

// ─── Metric cards (below chart) ─────────────────────────────
function updateMetricCards(daily, kwp) {
    const container = document.getElementById('solarMetrics');
    if (!container) return;

    const totalPeriod = daily.reduce((s, d) => s + d.kwhTotal, 0);
    const avgDaily = (totalPeriod / daily.length).toFixed(1);
    const bestDay = daily.reduce((a, b) => b.kwhTotal > a.kwhTotal ? b : a);
    const worstDay = daily.reduce((a, b) => b.kwhTotal < a.kwhTotal ? b : a);
    const bestPeak = daily.reduce((a, b) => b.peakKw > a.peakKw ? b : a);

    const totalEur = (totalPeriod * EUR_PER_KWH).toFixed(0);
    const avgYield = (avgDaily / kwp).toFixed(2);

    container.innerHTML = `
        <div class="metric-card">
            <span class="metric-label">Zeitraum Gesamt</span>
            <span class="metric-value">${totalPeriod.toFixed(0)} <small>kWh</small></span>
            <span class="metric-sub">≈ ${totalEur} €</span>
        </div>
        <div class="metric-card">
            <span class="metric-label">Ø pro Tag</span>
            <span class="metric-value">${avgDaily} <small>kWh</small></span>
            <span class="metric-sub">${avgYield} kWh/kWp</span>
        </div>
        <div class="metric-card">
            <span class="metric-label">Bester Tag</span>
            <span class="metric-value">${bestDay.kwhTotal.toFixed(0)} <small>kWh</small></span>
            <span class="metric-sub">${formatDay(bestDay.day)} · ${bestDay.peakKw.toFixed(1)} kW Spitze</span>
        </div>
        <div class="metric-card">
            <span class="metric-label">Beste Spitze</span>
            <span class="metric-value">${bestPeak.peakKw.toFixed(1)} <small>kW</small></span>
            <span class="metric-sub">${formatDay(bestPeak.day)}</span>
        </div>
    `;
}

function formatDay(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
}

// ─── Chart rendering ────────────────────────────────────────
function createSolarChart(hourly, daily, kwp) {
    if (window.solarChartInstance) window.solarChartInstance.destroy();

    const style = getComputedStyle(document.documentElement);
    const sun   = style.getPropertyValue('--sun').trim()   || '#FDB813';
    const accent = style.getPropertyValue('--accent').trim() || '#3b82f6';
    const muted = style.getPropertyValue('--text-muted').trim() || '#64748b';

    const h = window.innerWidth < 600 ? 340 : 420;

    // Build hourly series for the area chart
    const categories = hourly.map(d => d.time);
    const powerSeries = hourly.map(d => Math.round(d.kw * 10) / 10); // round to 1 decimal

    // Day background bands
    const dayBands = buildDayBands(hourly);

    const options = {
        series: [{
            name: `${kwp} kWp`,
            type: 'area',
            data: powerSeries
        }],
        colors: [sun],
        chart: {
            height: h,
            type: 'area',
            fontFamily: 'Outfit, sans-serif',
            toolbar: { show: false },
            zoom: { enabled: false },
            animations: { enabled: true, easing: 'easeinout', speed: 900 },
            brush: { enabled: false },
            dropShadow: { enabled: true, top: 8, left: 0, blur: 8, opacity: 0.04 }
        },
        stroke: {
            curve: 'smooth',
            width: 2.5,
            lineCap: 'round'
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'vertical',
                shadeIntensity: 0.4,
                opacityFrom: 0.55,
                opacityTo: 0.04,
                stops: [0, 95, 100]
            }
        },
        annotations: {
            xaxis: dayBands.concat([{
                x: Date.now(),
                borderColor: accent,
                strokeDashArray: 3,
                strokeWidth: 1,
                label: {
                    text: 'JETZT',
                    style: { color: accent, background: 'transparent', fontSize: '9px', fontWeight: 800 },
                    offsetY: -8
                }
            }])
        },
        grid: {
            borderColor: 'rgba(0,0,0,0.03)',
            strokeDashArray: 2,
            padding: { top: 16, bottom: 12, left: 8, right: 8 },
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } }
        },
        xaxis: {
            type: 'category',
            categories: categories,
            labels: {
                style: { colors: muted, fontSize: '10px', fontWeight: 600, fontFamily: 'Outfit' },
                minHeight: 36,
                rotateAlways: false,
                hideOverlappingLabels: true,
                formatter: (val) => {
                    // Show every 3rd hour label + always show noon-ish
                    const hr = parseInt(val.split('T')[1]?.split(':')[0] || '0');
                    if (hr % 3 === 0) {
                        const d = new Date(val + 'Z'); // parse as ISO
                        return String(d.getUTCHours()).padStart(2,'0') + ':00';
                    }
                    return '';
                }
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
            tooltip: { enabled: false } // we use custom tooltip
        },
        yaxis: {
            title: { text: 'Leistung (kW)', style: { color: muted, fontWeight: 600 } },
            labels: {
                style: { colors: muted },
                formatter: (v) => v.toFixed(0) + ' kW'
            },
            min: 0
        },
        tooltip: {
            theme: 'light',
            custom: ({ seriesIndex, dataPointIndex, w }) => {
                const pt = hourly[dataPointIndex];
                if (!pt) return '';
                const d = new Date(pt.time.replace(' ', 'T') + 'Z');
                const hh = String(d.getUTCHours()).padStart(2,'0');
                const mm = String(d.getUTCMinutes()).padStart(2,'0');
                const dd = formatDay(pt.time.split('T')[0]);
                const gtiround = Math.round(pt.gti);
                return `
                    <div class="solar-tooltip">
                        <div class="st-tip-time">${dd} ${hh}:${mm}</div>
                        <div class="st-tip-power">${pt.kw.toFixed(1)} <small>kW</small></div>
                        <div class="st-tip-gti">GTI ${gtiround} W/m²</div>
                    </div>`;
            }
        },
        legend: { show: false },
        dataLabels: { enabled: false },
        states: {
            hover: { filter: { type: 'none' } }
        },
        markers: {
            size: 0,
            hover: { size: 5, strokeWidth: 2, strokeColor: sun }
        },
        plotOptions: { area: { fillTo: 0 } }
    };

    window.solarChartInstance = new ApexCharts(document.querySelector('#solarChart'), options);
    window.solarChartInstance.render();
}

// ─── Build subtle day-separator bands ───────────────────────
function buildDayBands(hourly) {
    const bands = [];
    let lastDay = '';
    const days = ['So','Mo','Di','Mi','Do','Fr','Sa'];
    const months = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];

    for (let i = 0; i < hourly.length; i++) {
        const day = hourly[i].time.split('T')[0];
        if (day !== lastDay) {
            if (lastDay !== '') {
                // End previous day band at this index
                bands[bands.length - 1].x2 = i - 1;
            }
            const d = new Date(day + 'T00:00:00');
            const label = days[d.getUTCDay()] + ' ' + d.getUTCDate() + '. ' + months[d.getUTCMonth()];
            bands.push({
                x: i,
                x2: hourly.length - 1, // placeholder, updated when next day starts
                fillColor: i % 2 === 0 ? 'rgba(0,0,0,0.015)' : 'rgba(0,0,0,0.005)',
                opacity: 1,
                borderWidth: { top: 1, left: 0, right: 0, bottom: 0 },
                borderColor: 'rgba(0,0,0,0.06)',
                label: {
                    text: label,
                    style: { color: '#94a3b8', background: 'transparent', fontSize: '9px', fontWeight: 700, cssClass: 'apex-day-label' },
                    offsetY: -10,
                    orientation: 'horizontal',
                    position: 'left'
                }
            });
            lastDay = day;
        }
    }
    return bands;
}
