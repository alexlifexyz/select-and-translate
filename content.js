let popup = null;

// Debug flag
const DEBUG = true;

function log(...args) {
  if (DEBUG) {
    console.log('[Select and Translate Content]:', ...args);
  }
}

// Create translation popup
function createPopup(x, y) {
  const popup = document.createElement('div');
  popup.style.position = 'fixed'; // Changed to fixed for better positioning
  popup.style.left = `${x}px`;
  popup.style.top = `${y + 20}px`;
  popup.style.zIndex = '2147483647'; // Maximum z-index
  popup.style.backgroundColor = 'white';
  popup.style.padding = '10px';
  popup.style.borderRadius = '4px';
  popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  popup.style.maxWidth = '300px';
  popup.style.fontSize = '14px';
  popup.style.border = '1px solid #ddd';
  popup.style.userSelect = 'none'; // Prevent text selection in popup
  return popup;
}

// Handle text selection
document.addEventListener('mouseup', async (event) => {
  // Ignore if the click is on the popup
  if (popup && popup.contains(event.target)) {
    return;
  }

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  log('Selected text:', selectedText);
  
  if (selectedText) {
    try {
      // Remove existing popup
      if (popup) {
        document.body.removeChild(popup);
        popup = null;
      }

      // Get selection coordinates
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Create new popup
      popup = createPopup(rect.left + window.scrollX, rect.top + window.scrollY);
      popup.textContent = 'Translating...';
      document.body.appendChild(popup);
      log('Popup created');

      // Get translation engine preference
      chrome.storage.sync.get(['translationEngine'], result => {
        const engine = result.translationEngine || 'google';
        log('Using translation engine:', engine);
        
        // Request translation
        chrome.runtime.sendMessage({
          action: 'translate',
          text: selectedText,
          engine: engine
        }, response => {
          log('Received translation response:', response);
          
          // Check if popup still exists
          if (!popup || !document.body.contains(popup)) {
            log('Popup was removed before translation completed');
            return;
          }

          if (chrome.runtime.lastError) {
            log('Runtime error:', chrome.runtime.lastError);
            popup.textContent = `Error: ${chrome.runtime.lastError.message}`;
            popup.style.backgroundColor = '#fff0f0';
            return;
          }

          if (response && response.error) {
            popup.textContent = `Error: ${response.error}`;
            popup.style.backgroundColor = '#fff0f0';
          } else if (response && response.translation) {
            popup.textContent = response.translation;
          } else {
            popup.textContent = 'Translation failed. Please try again.';
            popup.style.backgroundColor = '#fff0f0';
          }
        });
      });
    } catch (error) {
      log('Error:', error);
      if (popup) {
        popup.textContent = `Error: ${error.message}`;
        popup.style.backgroundColor = '#fff0f0';
      }
    }
  } else if (popup && !popup.contains(event.target)) {
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

// Close popup when pressing Escape
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && popup) {
    document.body.removeChild(popup);
    popup = null;
  }
}); 