// Detect browser environment
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

// Initialize state
browserAPI.runtime.onInstalled.addListener(() => {
  browserAPI.storage.local.set({ focusModeEnabled: false });
});

// Listen for messages from popup or content scripts
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getState") {
    browserAPI.storage.local.get("focusModeEnabled", (data) => {
      sendResponse({ enabled: data.focusModeEnabled || false });
    });
    return true; // Required for async sendResponse
  } else if (request.action === "toggleFocus") {
    browserAPI.storage.local.get("focusModeEnabled", (data) => {
      const newState = !data.focusModeEnabled;
      browserAPI.storage.local.set({ focusModeEnabled: newState });
      
      // Send message to content script if on YouTube
      browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url.includes("youtube.com")) {
          try {
            browserAPI.tabs.sendMessage(tabs[0].id, { 
              action: "updateFocusMode", 
              enabled: newState 
            }).catch(() => {
              // Firefox might not support the chrome.scripting API
              console.log("Content script communication error");
            });
          } catch (e) {
            console.log("Error communicating with content script:", e);
          }
        }
      });
      
      sendResponse({ enabled: newState });
    });
    return true; // Required for async sendResponse
  }
});