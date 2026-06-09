# Wetter — Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and versions follow [Semantic Versioning](https://semver.org/).

## [2.1.0] — 2025-06-09

### Added
- **Current weather overview** — 4 cards showing temperature (with WMO weather icon), feels-like, humidity, wind speed; skeleton loading animation while data fetches
- **Loading states** — spinner overlay on both charts during data fetch instead of blank space
- **Error handling** — error banner for current weather, retry buttons on chart sections when API calls fail
- **Version tag** — visible version badge in footer, single source of truth via `VERSION` file
- **Changelog** — `CHANGELOG.md` for orderly change tracking

### Changed
- Solar irradiance API now sends `tilt=35&azimuth=180` (optimal south-facing PV for Austria ~47°N latitude) instead of relying on unknown defaults
- Duration buttons now show clean labels (`"2 Tage"`, `"4 Tage"`) instead of broken CSS pseudo-content (`"T"`, `" TAGE"`)
- Temperature summary now includes min/max range (`Ø 18.2 °C • 12.5 – 24.8 °C • Total 2.1 mm Regen`)
- Solar summary now shows **Deckung %** (coverage ratio of production vs consumption)
- All API calls include `timezone=auto`
- Chart heights responsive: 320px mobile / 400px desktop (was fixed 450px)
- Header margin reduced from 100px to 48px; weather cards fill the gap
- Footer margin reduced from 100px to 80px

### Fixed
- Duration button labels were broken due to CSS `::after` content mixing with static text

---

## [2.0.0] — 2025-01-24

### Added
- Initial release: temperature/rain hourly chart, solar production vs consumption daily chart
- City search via Open-Meteo geocoding API with autocomplete suggestions
- Preset buttons for Neusiedl am See and Wien
- Duration selector (2/4/7/10 days)
- Solar panel config inputs (roof area m², efficiency %, kWp display)
- Consumption profile from verbrauch.csv (household + heatpump, ~9000 kWh/year)
- ApexCharts for all visualizations
- Outfit font, atmospheric gradient background design
