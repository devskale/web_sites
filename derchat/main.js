// main.js
import {
  displayUserMessage,
  addSpinner,
  removeSpinner,
  handleError,
} from "./utils.js";
import { sendOllamaRequest } from "./ollama.js";
import { sendLlamaRequest } from "./llamacpp.js";
import { sendOpenAIRequest } from "./openai.js";
import { fetchAvailableModels } from "./modelFetcher.js";
import { servers, API_BEARER } from "./config.js";

let controller;

// Populate server field with options from config
const serverField = document.getElementById("serverField");
serverField.innerHTML = '<option value="">--Please choose a server--</option>';

servers.forEach((server, index) => {
  const option = document.createElement("option");
  option.value = server.url;
  option.textContent = server.url;
  option.setAttribute("data-description", server.description);
  option.setAttribute("data-index", index);
  serverField.appendChild(option);
});

/**
 * Gets the current server configuration object
 */
function getCurrentServerConfig() {
  const selectedOption = serverField.options[serverField.selectedIndex];
  if (!selectedOption || selectedOption.value === "") return null;
  const index = selectedOption.getAttribute("data-index");
  return servers[index];
}

// Set default server and fetch models
const defaultServerUrl = "https://api.arliai.com/v1";
const defaultModel = "Gemma-3-27B-it";
const modelField = document.getElementById("modelField");
modelField.setAttribute("data-default", defaultModel);

if (defaultServerUrl) {
  for (let i = 0; i < serverField.options.length; i++) {
    if (serverField.options[i].value === defaultServerUrl) {
      serverField.selectedIndex = i;
      const config = servers[serverField.options[i].getAttribute("data-index")];
      fetchAvailableModels(config.url, config.description, config.apiKey);
      break;
    }
  }
}

// Event listener for server field change
serverField.addEventListener("change", async function () {
  const config = getCurrentServerConfig();
  const modelField = document.getElementById("modelField");

  if (config) {
    try {
      await fetchAvailableModels(config.url, config.description, config.apiKey);
    } catch (error) {
      console.error("Error in fetchAvailableModels:", error);
      modelField.innerHTML = `<option value="">Error: ${error.message}</option>`;
    }
  } else {
    modelField.innerHTML =
      '<option value="">--Please choose a server first--</option>';
  }
});

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("inputField").focus();
});

document
  .getElementById("chatForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    const inputField = document.getElementById("inputField").value;
    const responseDiv = document.getElementById("response");
    const stopButton = document.getElementById("stopButton");
    const modelField = document.getElementById("modelField");
    const contextCheckbox = document.getElementById("contextCheck");
    const contextField = document.getElementById("contextField");
    const jsonCheckbox = document.getElementById("jsonCheck");
    const jsonField = document.getElementById("jsonField");
    const selectedModel = modelField.value;
    const config = getCurrentServerConfig();

    if (!config || !selectedModel) {
      alert("Please select both a server and a model.");
      return;
    }

    let assembledQuery = inputField;

    // Handle JSON format instructions
    if (jsonCheckbox.checked && jsonField) {
      const jsonValue = jsonField.value.trim();
      if (jsonValue) {
        assembledQuery += `\n\nReturn the response in JSON format according to this schema:\n${jsonValue}`;
      } else {
        assembledQuery += `\n\nReturn the response in valid JSON format.`;
      }
    }

    if (contextCheckbox.checked && contextField) {
      let contextValue = contextField.value;
      if (contextValue.startsWith("www.")) {
        contextValue = `https://${contextValue}`;
      }

      const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

      if (urlRegex.test(contextValue)) {
        try {
          const proxyUrl =
            "https://amd1.mooo.com/api/fetch_url?url=" +
            encodeURIComponent(contextValue);
          const response = await fetch(proxyUrl, {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${API_BEARER}`,
            },
          });

          if (!response.ok)
            throw new Error(`Failed to fetch URL content: ${response.status}`);
          const data = await response.json();
          if (data && data.content) {
            assembledQuery = `User Input:\n${inputField}\n\nContext:\n${data.content}`;
          }
        } catch (error) {
          handleError(responseDiv, error);
          return;
        }
      } else {
        assembledQuery = `User Input:\n${inputField}\n\nContext:\n${contextValue}`;
      }
    }

    displayUserMessage(responseDiv, inputField);
    const spinner = addSpinner(responseDiv);
    controller = new AbortController();
    const signal = controller.signal;
    stopButton.style.display = "inline-block";
    const startTime = performance.now();

    try {
      const desc = config.description.toLowerCase();
      if (desc.includes("ollama")) {
        await sendOllamaRequest(
          `${config.url}/api/chat`,
          selectedModel,
          assembledQuery,
          responseDiv,
          signal,
          startTime,
          config.apiKey,
          jsonCheckbox.checked
        );
      } else if (desc.includes("llama.cpp")) {
        await sendLlamaRequest(
          `${config.url}/chat/completions`,
          assembledQuery,
          responseDiv,
          signal,
          startTime,
          config.apiKey,
          jsonCheckbox.checked
        );
      } else {
        // Default to OpenAI-compatible for arliopenai, gemopenai, openai, etc.
        await sendOpenAIRequest(
          config.url,
          selectedModel,
          assembledQuery,
          responseDiv,
          signal,
          startTime,
          config.apiKey,
          jsonCheckbox.checked
        );
      }
    } catch (error) {
      handleError(responseDiv, error);
    } finally {
      stopButton.style.display = "none";
      removeSpinner(responseDiv, spinner);
    }
    document.getElementById("inputField").value = "";
  });

document.getElementById("stopButton").addEventListener("click", function () {
  if (controller) controller.abort();
});

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("show");
}

document
  .getElementById("sidebarToggle")
  .addEventListener("click", toggleSidebar);

document.addEventListener("click", function (event) {
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");

  if (
    !sidebar.contains(event.target) &&
    !sidebarToggle.contains(event.target) &&
    sidebar.classList.contains("show")
  ) {
    sidebar.classList.remove("show");
  }
});
