/**
 * Consumption data based on verbrauch.csv
 * Values in kWh per month
 */
const CONSUMPTION_DATA = [
    { month: "Januar", household: 400, heatpump: 800, total: 1200 },
    { month: "Februar", household: 380, heatpump: 700, total: 1080 },
    { month: "Maerz", household: 390, heatpump: 500, total: 890 },
    { month: "April", household: 390, heatpump: 200, total: 590 },
    { month: "Mai", household: 390, heatpump: 100, total: 490 },
    { month: "Juni", household: 400, heatpump: 80, total: 480 },
    { month: "Juli", household: 410, heatpump: 80, total: 490 },
    { month: "August", household: 410, heatpump: 80, total: 490 },
    { month: "September", household: 390, heatpump: 100, total: 490 },
    { month: "Oktober", household: 390, heatpump: 250, total: 640 },
    { month: "November", household: 395, heatpump: 500, total: 895 },
    { month: "Dezember", household: 410, heatpump: 830, total: 1240 }
];

window.CONSUMPTION_DATA = CONSUMPTION_DATA;
