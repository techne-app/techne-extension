import { vectorDb } from './db';
import { CONFIG } from '../config';

// Handle extension icon clicks
chrome.action.onClicked.addListener(async () => {
  const indexUrl = chrome.runtime.getURL("index.html");
  const existingTabs = await chrome.tabs.query({ url: indexUrl });

  if (existingTabs.length > 0) {
    // If tab exists, focus it
    await chrome.tabs.update(existingTabs[0].id!, { active: true });
    await chrome.windows.update(existingTabs[0].windowId, { focused: true });
  } else {
    // Create new tab
    await chrome.tabs.create({ url: indexUrl });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NEW_EMBEDDING') {
    try {
      vectorDb.storeEmbedding(
        message.data.tag, 
        Array.from(new Float32Array(message.data.vectorData)), // Convert Float32Array to regular array
        message.data.anchor
      )
        .then(() => {
          // 1. Notify popup if it's open
          chrome.tabs.query({url: chrome.runtime.getURL("index.html")}, (tabs) => {
            tabs.forEach((tab) => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                  type: 'EMBEDDINGS_UPDATED'
                });
              }
            });
          });
          
          // 2. Notify content scripts on relevant pages (if you need to)
          // chrome.tabs.query({url: "https://your-site.com/*"}, ...);
        })
        .catch((error) => {
          console.error('Error storing embedding:', error);
        });
    } catch (error) {
      console.error('Error processing message:', error);
    }
    return true; // Indicate async response
  }
});

// Optional: Handle extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
}); 