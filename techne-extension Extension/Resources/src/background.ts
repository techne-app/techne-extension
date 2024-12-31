import { vectorDb } from './db';

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
    vectorDb.storeEmbedding(message.data.tag, message.data.vectorData)
      .then(() => {
        // Notify all tabs about the update
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id!, {
              type: 'EMBEDDINGS_UPDATED'
            });
          });
        });
      })
      .catch((error) => {
        console.error('Error storing embedding:', error);
      });
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