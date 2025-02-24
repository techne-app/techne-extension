import { tagDb } from './db';
import { CONFIG } from '../config';
import { isFeatureEnabled } from '../utils/featureFlags';
import { ExtensionServiceWorkerMLCEngineHandler } from "@mlc-ai/web-llm";
import { 
  MessageType, 
  ExtensionRequest, 
  ExtensionResponse
} from '../types/messages';

import { personalize_with_webllm } from './personalization';  
import { personalize_with_tjs_embeddings } from './personalization';

let mlcHandler: ExtensionServiceWorkerMLCEngineHandler | undefined;

if (isFeatureEnabled('use_webllm')) {
  // Handle MLCBot connections
  chrome.runtime.onConnect.addListener(function (port) {
    if (port.name === "web_llm_service_worker") {
      if (mlcHandler === undefined) {
        mlcHandler = new ExtensionServiceWorkerMLCEngineHandler(port);
      } else {
        mlcHandler.setPort(port);
      }
      port.onMessage.addListener(mlcHandler.onmessage.bind(mlcHandler));
    }
  });
}

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
chrome.runtime.onMessage.addListener((
  message: ExtensionRequest, 
  sender, 
  sendResponse: (response: ExtensionResponse) => void
) => {
  if (message.type === MessageType.NEW_TAG) {
    try {
      tagDb.storeTag(
        message.data.tag, 
        message.data.type,
        message.data.anchor
      )
        .then(() => {
          chrome.tabs.query({url: chrome.runtime.getURL("index.html")}, (tabs) => {
            tabs.forEach((tab) => {
              if (tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                  type: MessageType.TAGS_UPDATED,
                  data: {}
                });
              }
            });
          });
        })
        .catch((error) => {
          console.error('Error storing tag:', error);
        });
    } catch (error) {
      console.error('Error processing message:', error);
    }
    return true;
  }

  if (message.type === MessageType.RANK_TAGS) {
    (async () => {
      try {

        if (isFeatureEnabled('use_webllm')) {

          if (mlcHandler) {
            const { storyTags, tagTypes, tagAnchors } = message.data;
            const historicalTags = await tagDb.getAllTags();
  
            const result = await personalize_with_webllm(mlcHandler, historicalTags, storyTags, tagTypes, tagAnchors);
            sendResponse({ 
              type: MessageType.RANK_TAGS_COMPLETE, 
              data: { result }
            });
          } else {
            sendResponse({
              type: MessageType.ERROR,
              data: { error: 'MLC handler is not connected yet.' }
            });
            return;
          }

        } else if (isFeatureEnabled('use_tjs')) {
          const { storyTags, tagTypes, tagAnchors } = message.data;
          const historicalTags = await tagDb.getAllTags();

          const result = await personalize_with_tjs_embeddings(historicalTags, storyTags, tagTypes, tagAnchors);
          sendResponse({ 
            type: MessageType.RANK_TAGS_COMPLETE, 
            data: { result }
          });

        } 
        else {
          const { storyTags, tagTypes, tagAnchors } = message.data;
          const result = { tags: storyTags, types: tagTypes, anchors: tagAnchors };
          sendResponse({ 
            type: MessageType.RANK_TAGS_COMPLETE, 
            data: { result }
          });
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        sendResponse({ 
          type: MessageType.ERROR, 
          data: { error: errorMessage }
        });
      }
    })();
    return true;
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