import monitor from './monitor.js';

// Register background script as a component
monitor.registerComponent('background_script');

// Debug flag
const DEBUG = true;

function log(...args) {
  if (DEBUG) {
    console.log('[Select and Translate Background]:', ...args);
    monitor.logEvent('debug', args.join(' '));
  }
}

// Google Translate API endpoint
const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh&dt=t&q=';

// Function to translate using Google Translate
async function googleTranslate(text) {
  try {
    log('Calling Google Translate API with text:', text);
    const response = await fetch(GOOGLE_TRANSLATE_API + encodeURIComponent(text));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    log('Google Translate response:', data);
    
    if (!data || !data[0] || !data[0][0] || !data[0][0][0]) {
      throw new Error('Invalid response format from Google Translate');
    }
    
    monitor.logEvent('translation', 'Google Translate success');
    return data[0][0][0];
  } catch (error) {
    log('Google Translate error:', error);
    monitor.logError('background_script', error);
    throw new Error(`Failed to translate using Google Translate: ${error.message}`);
  }
}

// Function to translate using Gemini
async function geminiTranslate(text, apiKey) {
  try {
    log('Calling Gemini API with text:', text);
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Translate the following text to Chinese: "${text}"`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    log('Gemini API response:', data);

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      monitor.logEvent('translation', 'Gemini translation success');
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response format from Gemini API');
    }
  } catch (error) {
    log('Gemini API error:', error);
    monitor.logError('background_script', error);
    throw new Error(`Failed to translate using Gemini: ${error.message}`);
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log('Received message:', request);
  monitor.logMessage('request', request, sender);
  
  if (request.action === 'translate') {
    // Handle Google Translate
    if (request.engine === 'google') {
      googleTranslate(request.text)
        .then(translation => {
          log('Google translation successful:', translation);
          monitor.updateComponentStatus('background_script', 'active');
          sendResponse({ translation });
        })
        .catch(error => {
          log('Google translation failed:', error);
          monitor.logError('background_script', error);
          sendResponse({ error: error.message });
        });
    }
    // Handle Gemini
    else if (request.engine === 'gemini') {
      chrome.storage.sync.get(['geminiApiKey'], result => {
        if (!result.geminiApiKey) {
          log('Gemini API key not configured');
          monitor.logError('background_script', 'Gemini API key not configured');
          sendResponse({ error: 'Gemini API key not configured' });
          return;
        }
        
        geminiTranslate(request.text, result.geminiApiKey)
          .then(translation => {
            log('Gemini translation successful:', translation);
            monitor.updateComponentStatus('background_script', 'active');
            sendResponse({ translation });
          })
          .catch(error => {
            log('Gemini translation failed:', error);
            monitor.logError('background_script', error);
            sendResponse({ error: error.message });
          });
      });
    }
    // Handle unknown engine
    else {
      log('Unknown translation engine:', request.engine);
      monitor.logError('background_script', `Unknown translation engine: ${request.engine}`);
      sendResponse({ error: 'Unknown translation engine' });
    }
    
    return true; // Will respond asynchronously
  }
}); 