// Burger menu functionality for DaChat application

// Import providers from config.js
import { providers } from "./config.js";

// Custom instruction selection functionality
function setupCustomInstructionSelection() {
  const instructionSelect = document.querySelector(
    'select[name="instruction"]'
  );
  const sidebarInstructionField = document.querySelector(
    'aside textarea[name="instruction"]'
  );

  if (instructionSelect && sidebarInstructionField) {
    instructionSelect.addEventListener("change", (e) => {
      if (e.target.value === "custom") {
        e.target.value = "";
        e.target.blur();
        sidebarInstructionField.focus();
      }
    });

    sidebarInstructionField.addEventListener("input", () => {
      if (instructionSelect.value === "") {
        instructionSelect.value = "custom";
      }
    });
  }
}

// Function to populate provider dropdown
function populateProviderDropdown() {
  const providerSelect = document.getElementById("provider-select");
  const modelSelect = document.getElementById("model-select");

  if (!providerSelect) {
    console.error("Provider select element not found!");
    return;
  }

  // Clear existing options except the first one
  while (providerSelect.options.length > 1) {
    providerSelect.remove(1);
  }

  // Add provider options
  providers.forEach((provider, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${provider.description} (${provider.url})`;
    providerSelect.appendChild(option);
  });

  // Add event listener to update models when provider changes
  providerSelect.addEventListener("change", () => {
    populateModelDropdown(providerSelect.value);
  });
}

// Function to populate model dropdown based on selected provider
function populateModelDropdown(providerIndex) {
  const modelSelect = document.getElementById("model-select");

  if (!modelSelect) {
    console.error("Model select element not found!");
    return;
  }

  // Clear existing options except the first one
  while (modelSelect.options.length > 1) {
    modelSelect.remove(1);
  }

  // If no provider selected, return
  if (providerIndex === "") {
    return;
  }

  // Add model options for selected provider
  const provider = providers[providerIndex];
  if (provider && provider.models) {
    provider.models.forEach((model) => {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      modelSelect.appendChild(option);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const burgerButton = document.querySelector(".burger-button");
  const closeButton = document.querySelector(".close-button");
  const sidebar = document.querySelector("aside");

  if (!burgerButton) console.error("Burger button not found!");
  if (!closeButton) console.error("Close button not found!");
  if (!sidebar) console.error("Sidebar element not found!");

  burgerButton.addEventListener("click", () => {
    console.log("Burger button clicked");
    console.log("Current sidebar classes:", sidebar.className);

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      // Mobile behavior
      const isHidden = sidebar.classList.contains("hidden");

      // Toggle mobile menu state
      if (isHidden) {
        // Show mobile menu
        sidebar.classList.remove("hidden");
        sidebar.classList.add("sidebar-mobile", "fixed", "inset-0", "z-10");
      } else {
        // Hide mobile menu
        sidebar.classList.add("hidden");
        setTimeout(() => {
          sidebar.classList.remove(
            "sidebar-mobile",
            "fixed",
            "inset-0",
            "z-10"
          );
        }, 300); // Match CSS transition duration
      }
    } else {
      // Desktop behavior - ensure consistent state
      sidebar.classList.remove(
        "hidden",
        "fixed",
        "inset-0",
        "z-10",
        "sidebar-mobile"
      );
      sidebar.classList.add("md:block");
    }

    console.log("Updated sidebar classes:", sidebar.className);
  });

  // Close button functionality
  closeButton.addEventListener("click", () => {
    console.log("Close button clicked");

    if (window.innerWidth < 768) {
      // Hide mobile menu
      sidebar.classList.add("hidden");
      setTimeout(() => {
        sidebar.classList.remove("sidebar-mobile", "fixed", "inset-0", "z-10");
      }, 300); // Match CSS transition duration
    }
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth < 768 &&
      !sidebar.classList.contains("hidden") &&
      !e.target.closest("aside") &&
      !e.target.closest(".burger-button")
    ) {
      sidebar.classList.add("hidden");
      sidebar.classList.remove("fixed", "inset-0", "z-10", "sidebar-mobile");
    }
  });

  setupCustomInstructionSelection();

  // Populate provider dropdown with options from config.js
  populateProviderDropdown();
});
