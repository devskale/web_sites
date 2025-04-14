document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements
  const energySlider = document.getElementById("energy");
  const energyValue = document.getElementById("energy-value");
  const pvSlider = document.getElementById("pv");
  const pvValue = document.getElementById("pv-value");
  const usagePattern = document.getElementById("usage-pattern");
  const batteryType = document.getElementById("battery-type");
  const calculateBtn = document.getElementById("calculate-btn");
  const resultsSection = document.getElementById("results");
  const capacityValue = document.getElementById("capacity-value");
  const powerValue = document.getElementById("power-value");
  const autonomyDays = document.getElementById("autonomy-days");
  const batteryCost = document.getElementById("battery-cost");
  const inverterCost = document.getElementById("inverter-cost");
  const totalCost = document.getElementById("total-cost");
  const recommendations = document.getElementById("recommendations");

  // Format number with commas
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Sync slider and input field for energy
  energySlider.addEventListener("input", function () {
    energyValue.value = this.value;
  });

  energyValue.addEventListener("input", function () {
    if (this.value > 100000) this.value = 100000;
    if (this.value < 1000) this.value = 1000;
    energySlider.value = this.value;
  });

  // Sync slider and input field for PV
  pvSlider.addEventListener("input", function () {
    pvValue.value = this.value;
  });

  pvValue.addEventListener("input", function () {
    if (this.value > 100) this.value = 100;
    if (this.value < 1) this.value = 1;
    pvSlider.value = this.value;
  });

  // Calculate button click handler
  calculateBtn.addEventListener("click", function () {
    const energy = parseFloat(energyValue.value);
    const pv = parseFloat(pvValue.value);
    const usage = usagePattern.value;
    const battery = batteryType.value;

    // Calculate optimal storage (more sophisticated algorithm)
    const dailyConsumption = energy / 365;
    const solarCoverage = pv * 4 * 365; // 4 kWh/day per kWp (average)

    // Adjust autonomy factor based on usage pattern
    let autonomyFactor;
    switch (usage) {
      case "residential":
        autonomyFactor = 2;
        break;
      case "commercial":
        autonomyFactor = 1.5;
        break;
      case "industrial":
        autonomyFactor = 1;
        break;
      default:
        autonomyFactor = 2;
    }

    // Adjust battery capacity based on type
    let batteryFactor;
    switch (battery) {
      case "lithium":
        batteryFactor = 1;
        break;
      case "lead-acid":
        batteryFactor = 1.2;
        break;
      case "flow":
        batteryFactor = 0.8;
        break;
      default:
        batteryFactor = 1;
    }

    // Calculate recommended capacity and power
    const recommendedCapacity = Math.round(
      dailyConsumption * autonomyFactor * batteryFactor
    );
    const recommendedPower = Math.round(
      recommendedCapacity / (autonomyFactor * 2)
    );

    // Calculate costs
    const batteryCostPerKwh = battery === "lead-acid" ? 500 : 800;
    const inverterCostPerKw = 300;
    const totalBatteryCost = recommendedCapacity * batteryCostPerKwh;
    const totalInverterCost = recommendedPower * inverterCostPerKw;

    // Update UI with results
    capacityValue.textContent = formatNumber(recommendedCapacity);
    powerValue.textContent = formatNumber(recommendedPower);
    autonomyDays.textContent =
      autonomyFactor === 2 ? "2-3" : autonomyFactor === 1.5 ? "1-2" : "1";
    batteryCost.textContent = formatNumber(totalBatteryCost);
    inverterCost.textContent = formatNumber(totalInverterCost);
    totalCost.textContent = formatNumber(totalBatteryCost + totalInverterCost);

    // Generate recommendations
    recommendations.innerHTML = "";

    if (battery === "lead-acid") {
      recommendations.innerHTML +=
        '<div class="bg-yellow-50 p-4 rounded-lg mb-3"><p class="text-sm text-gray-700"><i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>Lead-acid batteries require more maintenance and have shorter lifespans than lithium-ion.</p></div>';
    }

    if (pv / recommendedCapacity < 0.5) {
      recommendations.innerHTML +=
        '<div class="bg-blue-50 p-4 rounded-lg mb-3"><p class="text-sm text-gray-700"><i class="fas fa-lightbulb text-blue-500 mr-2"></i>Consider increasing your solar capacity to better match your storage needs.</p></div>';
    }

    if (usage === "industrial") {
      recommendations.innerHTML +=
        '<div class="bg-purple-50 p-4 rounded-lg"><p class="text-sm text-gray-700"><i class="fas fa-industry text-purple-500 mr-2"></i>For industrial applications, consider multiple battery systems for redundancy.</p></div>';
    }

    // Show results section
    resultsSection.classList.remove("hidden");
  });
});
