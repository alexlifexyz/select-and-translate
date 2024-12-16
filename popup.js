document.addEventListener('DOMContentLoaded', () => {
  const engineSelect = document.getElementById('translationEngine');
  const geminiConfig = document.getElementById('geminiConfig');
  const geminiApiKeyInput = document.getElementById('geminiApiKey');
  const saveButton = document.getElementById('saveApiKey');

  // Load saved settings
  chrome.storage.sync.get(['translationEngine', 'geminiApiKey'], (result) => {
    if (result.translationEngine) {
      engineSelect.value = result.translationEngine;
    }
    if (result.geminiApiKey) {
      geminiApiKeyInput.value = result.geminiApiKey;
    }
    updateGeminiConfigVisibility();
  });

  // Handle translation engine change
  engineSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ translationEngine: engineSelect.value });
    updateGeminiConfigVisibility();
  });

  // Handle API key save
  saveButton.addEventListener('click', () => {
    const apiKey = geminiApiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
        alert('Gemini API Key saved successfully!');
      });
    } else {
      alert('Please enter a valid API key');
    }
  });

  function updateGeminiConfigVisibility() {
    geminiConfig.style.display = 
      engineSelect.value === 'gemini' ? 'flex' : 'none';
  }
}); 