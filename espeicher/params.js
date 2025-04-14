const config = {
  // Energy consumption range (kWh)
  energy: {
    min: 1000,
    max: 100000,
    step: 100,
    default: 15000,
  },

  // PV system capacity range (kWp)
  pv: {
    min: 1,
    max: 100,
    step: 0.5,
    default: 15,
  },

  // Usage patterns
  usagePatterns: [
    { value: "residential", label: "Residential (Evening Peak)" },
    { value: "commercial", label: "Commercial (Daytime Usage)" },
    { value: "industrial", label: "Industrial (24/7 Operation)" },
  ],

  // Battery types
  batteryTypes: [
    { value: "lithium", label: "Lithium-ion (High performance)" },
    { value: "lead-acid", label: "Lead-acid (Budget option)" },
    { value: "flow", label: "Flow Battery (Long duration)" },
  ],

  // Calculation factors
  factors: {
    solarCoveragePerKw: 4, // kWh/day per kWp
    specificEnergyYield: 1275, // kWh/kWp
    degradationFactor: 0.85, // Annual degradation factor
    residentialAutonomy: 2,
    commercialAutonomy: 1.5,
    industrialAutonomy: 1,
    lithiumFactor: 1,
    leadAcidFactor: 1.2,
    flowBatteryFactor: 0.8,
  },

  // Cost parameters ($)
  costs: {
    lithiumPerKwh: 800,
    leadAcidPerKwh: 500,
    inverterPerKw: 300,
  },
};

export default config;
