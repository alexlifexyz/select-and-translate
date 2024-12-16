let popup = null;

// Debug flag
const DEBUG = true;

function log(...args) {
  if (DEBUG) {
    console.log('[Select and Translate]:', ...args);
  }
}

document.addEventListener('mouseup', async (event) => {
  const selectedText = window.getSelection().toString().trim();
  log('Selected text:', selectedText);
  
  if (selectedText) {
    try {
      // Remove existing popup if it exists
      if (popup) {
        document.body.removeChild(popup);
      }

      // Create new popup
      popup = document.createElement('div');
      popup.style.position = 'absolute';
      popup.style.left = `${event.pageX}px`;
      popup.style.top = `${event.pageY + 20}px`;
      popup.style.zIndex = '10000';
      popup.style.backgroundColor = 'white';
      popup.style.padding = '10px';
      popup.style.borderRadius = '4px';
      popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      popup.style.maxWidth = '300px';
      popup.style.fontSize = '14px';
      popup.style.border = '1px solid #ddd';

      popup.textContent = 'Translating...';
      document.body.appendChild(popup);
      log('Popup created');

      // Get translation engine preference from storage
      chrome.storage.sync.get(['translationEngine'], async (result) => {
        const engine = result.translationEngine || 'google';
        log('Using translation engine:', engine);
        
        // Send message to background script for translation
        chrome.runtime.sendMessage({
          action: 'translate',
          text: selectedText,
          engine: engine
        }, response => {
          log('Received translation response:', response);
          if (popup) {
            if (response && response.error) {
              popup.textContent = `Error: ${response.error}`;
              popup.style.backgroundColor = '#fff0f0';
            } else if (response && response.translation) {
              popup.textContent = response.translation;
            } else {
              popup.textContent = 'Translation failed. Please try again.';
              popup.style.backgroundColor = '#fff0f0';
            }
          }
        });
      });
    } catch (error) {
      log('Error:', error);
      if (popup) {
        popup.textContent = 'An error occurred. Please try again.';
        popup.style.backgroundColor = '#fff0f0';
      }
    }
  } else if (popup) {
    document.body.removeChild(popup);
    popup = null;
  }
});

// Close popup when clicking outside
document.addEventListener('mousedown', (event) => {
  if (popup && !popup.contains(event.target)) {
    document.body.removeChild(popup);
    popup = null;
  }
}); 