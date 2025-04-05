// DaChat application functionality

// Import providers from config.js
import { providers } from "./config.js";
import { sendOllamaRequest, configureMarked } from "./ollama.js";
import { displayUserMessage } from "./utils.js";
import { fetchAvailableModels } from "./models.js";

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
    option.setAttribute("data-description", provider.description);
    providerSelect.appendChild(option);
  });

  // Set a default provider if none is selected
  if (providerSelect.value === "") {
    console.log("Setting default provider");
    providerSelect.value = "0"; // Select the first provider by default
    // Trigger change event to load models
    const changeEvent = new Event("change");
    providerSelect.dispatchEvent(changeEvent);
  }

  // Add event listener to update models when provider changes
  providerSelect.addEventListener("change", () => {
    const selectedOption = providerSelect.options[providerSelect.selectedIndex];
    const providerIndex = providerSelect.value;

    if (providerIndex !== "") {
      const provider = providers[providerIndex];
      const serverType = selectedOption.getAttribute("data-description");

      // Try to fetch models dynamically first
      fetchAvailableModels(provider.url, serverType);
    } else {
      // If no provider selected, clear model dropdown
      populateModelDropdown("");
    }
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
    provider.models.forEach((model, index) => {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      modelSelect.appendChild(option);

      // Select the first model by default
      if (index === 0) {
        modelSelect.value = model;
      }
    });
    console.log(
      "Models populated for provider",
      providerIndex,
      "- Default model:",
      modelSelect.value
    );
  }
}

// Function to handle sending messages to the selected provider
async function sendMessage() {
  console.log("sendMessage function called");
  // Use a more specific selector for the input field
  const messageInput = document.querySelector(
    '#chatForm input[type="text"], .p-4.border-t input[type="text"]'
  );
  const chatMessages = document.getElementById("chat-messages");
  const providerSelect = document.getElementById("provider-select");
  const modelSelect = document.getElementById("model-select");
  const contextCheckbox = document.getElementById("context-checkbox");
  const contextTextarea = document.querySelector(
    'aside textarea[name="context"]'
  );

  console.log("Elements found:", {
    messageInput: messageInput !== null,
    chatMessages: chatMessages !== null,
    providerSelect: providerSelect !== null,
    modelSelect: modelSelect !== null,
  });

  // Get user input
  const userInput = messageInput.value.trim();
  console.log("User input:", userInput);
  if (!userInput) {
    console.log("No user input, returning");
    return;
  }

  // Get provider and model selection
  const providerIndex = providerSelect.value;
  const modelName = modelSelect.value;

  console.log("Provider and model selection:", { providerIndex, modelName });

  if (!providerIndex || providerIndex === "") {
    console.log("No provider selected");
    alert("Please select a provider");
    return;
  }

  if (!modelName || modelName === "") {
    console.log("No model selected");
    alert("Please select a model");
    return;
  }

  const provider = providers[providerIndex];

  // Display user message
  displayUserMessage(chatMessages, userInput);

  // Clear input field
  messageInput.value = "";

  // Prepare context if enabled
  let fullPrompt = userInput;
  if (contextCheckbox && contextCheckbox.checked && contextTextarea) {
    const context = contextTextarea.value.trim();
    if (context) {
      fullPrompt = `Context:\n${context}\n\nQuestion:\n${userInput}`;
    }
  }

  // Create abort controller for the fetch request
  const abortController = new AbortController();
  const startTime = performance.now();

  try {
    // Check if the provider is Ollama
    if (provider.description.toLowerCase() === "ollama") {
      await sendOllamaRequest(
        provider.url,
        modelName,
        fullPrompt,
        chatMessages,
        abortController.signal,
        startTime
      );
    } else {
      // For other providers, we would implement their specific API calls here
      // This is a placeholder for future implementation
      const messageContainer = document.createElement("div");
      messageContainer.className =
        "bg-gray-100 p-3 rounded-lg max-w-3xl ml-auto";

      const messageElement = document.createElement("div");
      messageElement.className = "prose";
      messageElement.textContent =
        "Only Ollama providers are currently supported.";

      messageContainer.appendChild(messageElement);
      chatMessages.appendChild(messageContainer);
    }
  } catch (error) {
    console.error("Error sending message:", error);

    // Display error message
    const messageContainer = document.createElement("div");
    messageContainer.className = "bg-red-100 p-3 rounded-lg max-w-3xl ml-auto";

    const messageElement = document.createElement("div");
    messageElement.textContent = `Error: ${error.message}`;

    messageContainer.appendChild(messageElement);
    chatMessages.appendChild(messageContainer);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Load required libraries for markdown parsing and syntax highlighting
  const markdownScript = document.createElement("script");
  markdownScript.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
  document.head.appendChild(markdownScript);

  const highlightCss = document.createElement("link");
  highlightCss.rel = "stylesheet";
  highlightCss.href =
    "https://cdn.jsdelivr.net/npm/highlight.js@11.7.0/styles/github.min.css";
  document.head.appendChild(highlightCss);

  const highlightScript = document.createElement("script");
  highlightScript.src =
    "https://cdn.jsdelivr.net/npm/highlight.js@11.7.0/lib/highlight.min.js";
  document.head.appendChild(highlightScript);

  // Configure marked once libraries are loaded
  highlightScript.onload = configureMarked;

  const burgerButton = document.querySelector(".burger-button");
  const closeButton = document.querySelector(".close-button");
  const sidebar = document.querySelector("aside");
  const sendButton = document.querySelector("button.bg-blue-500");
  const messageInput = document.querySelector(
    '.p-4.border-t input[type="text"]'
  );

  if (!burgerButton) console.error("Burger button not found!");
  if (!closeButton) console.error("Close button not found!");
  if (!sidebar) console.error("Sidebar element not found!");
  if (!sendButton) console.error("Send button not found!");
  if (!messageInput) console.error("Message input not found!");

  // Create a simple form submit handler
  const inputContainer = document.querySelector(".p-4.border-t .flex");
  if (inputContainer) {
    // Create the form element
    const chatForm = document.createElement("form");
    chatForm.id = "chatForm";
    chatForm.className = "flex space-x-2 items-center w-full";
    chatForm.addEventListener("submit", function (event) {
      event.preventDefault();
      sendMessage();
    });

    // Clone the container's children
    const children = Array.from(inputContainer.children);

    // Replace the flex container with our form
    inputContainer.parentNode.replaceChild(chatForm, inputContainer);

    // Move all children to the form
    children.forEach((child) => chatForm.appendChild(child));
  }

  // Add event listener for send button
  if (sendButton) {
    console.log("Adding click event listener to send button");
    sendButton.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Send button clicked");
      sendMessage();
    });
  } else {
    // Fallback in case the button wasn't found with the original selector
    const allButtons = document.querySelectorAll("button");
    console.log("Searching through all buttons:", allButtons.length);

    allButtons.forEach((button) => {
      if (button.textContent.trim() === "Send") {
        console.log("Found Send button by text content");
        button.addEventListener("click", function (e) {
          e.preventDefault();
          console.log("Send button clicked");
          sendMessage();
        });
      }
    });
  }

  // Add event listener for Enter key in message input
  if (messageInput) {
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
  }

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
