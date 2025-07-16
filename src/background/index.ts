import { embed_tags } from "./embed.js";
import { rankTagsBySimilarity, computeTensorSimilarity } from "./personalize";
import { contextDb } from "./contextDb";
import * as ort from 'onnxruntime-web';
import { isPersonalizationEnabled } from '../utils/featureFlags';

import { 
  MessageType, 
  ExtensionRequest, 
  ExtensionResponse
} from '../types/messages';


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

// Optional: Handle extension installation/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
}); 

    
export function registerPersonalizeMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      (async function () {
          try {
              if (message.type === MessageType.RANK_TAGS) {
                  // Check if personalization is enabled (both feature flag and user setting)
                  const personalizationEnabled = await isPersonalizationEnabled();
                  
                  if (!personalizationEnabled) {
                      // If personalization is disabled, return the original tags without ranking
                      const { storyTags, tagTypes, tagAnchors } = message.data;
                      sendResponse({ 
                          type: MessageType.RANK_TAGS_COMPLETE, 
                          data: { 
                              result: {
                                  tags: storyTags,
                                  types: tagTypes,
                                  anchors: tagAnchors
                              }
                          }
                      });
                      return;
                  }
                  
                  // Personalization is enabled, continue with existing logic
                  const { storyTags, tagTypes, tagAnchors } = message.data;
                  if (storyTags.length !== tagTypes.length || storyTags.length !== tagAnchors.length) {
                      throw new Error("Input arrays must all have the same length");
                  }
              
                  // Get recent tags from the database
                  const recentTags = await contextDb.getRecentTags(10);
                  const recentTagTexts = recentTags.map(tag => tag.tag || '').filter(tag => tag !== '');
                  
                  // Get recent searches from the database
                  const recentSearches = await contextDb.getRecentSearches(10);
                  const recentSearchTexts = recentSearches.map(search => search.query).filter(query => query !== '');
                  
                  // Combine both lists into a single list of historical texts
                  const historicalTexts = [...recentTagTexts, ...recentSearchTexts];
                  
                  // If we have any historical data, use it for personalization
                  if (historicalTexts.length > 0) {
                      // Compute embeddings for story tags
                      const inputEmbeddings = await embed_tags(storyTags);
                      
                      // Compute embeddings for all historical texts
                      const historicalEmbeddings = await embed_tags(historicalTexts);

                      // Use the existing rankTagsBySimilarity function with the combined historical data
                      const result = await rankTagsBySimilarity(
                          inputEmbeddings,
                          historicalEmbeddings,
                          storyTags,
                          tagTypes,
                          tagAnchors
                      );

                      // Send response with correctly ordered arrays
                      sendResponse({ 
                          type: MessageType.RANK_TAGS_COMPLETE, 
                          data: { result }
                      });
                  } else {
                      // No historical data available, return input lists as is
                      sendResponse({ 
                          type: MessageType.RANK_TAGS_COMPLETE, 
                          data: { 
                              result: {
                                  tags: storyTags,
                                  types: tagTypes,
                                  anchors: tagAnchors
                              }
                          }
                      });
                  }
              } else {
                  sendResponse({ success: false, error: `Unknown type: ${message.type}` });
              }
          } catch (error) {
              console.error('Error in background script:', error);
              sendResponse({ 
                  success: false, 
                  error: error instanceof Error ? error.message : String(error) 
              });
          }
      })();
  
      return true; // Indicates async response
  });
}


// Create a function to register the message listener
export function registerTagMessageListener() {
  // Listen for messages from content scripts
  chrome.runtime.onMessage.addListener((
    message: ExtensionRequest, 
    sender, 
    sendResponse: (response: ExtensionResponse) => void
  ) => {
    if (message.type === MessageType.NEW_TAG) {
      try {
        console.log('NEW_TAG received:', message.data);
        contextDb.storeTag(
          message.data.tag, 
          message.data.type,
          message.data.anchor
        )
          .then(() => {
            console.log('Tag stored successfully, notifying popup');
            // Send message to all extension pages
            chrome.runtime.sendMessage({
              type: MessageType.TAGS_UPDATED,
              data: {}
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
  });
  
  console.log('Tag message listener registered');
}

// Add this function
export function registerTagMatchingListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === MessageType.TAG_MATCH_REQUEST) {
      (async function() {
        try {
          const { inputText, tags } = message.data;
          
          if (!inputText || !tags || tags.length === 0) {
            chrome.runtime.sendMessage({
              type: MessageType.TAG_MATCH_RESPONSE,
              data: { 
                matches: [],
                error: 'Invalid input or no tags available'
              }
            });
            return;
          }
          
          // Generate embedding for input text
          const inputEmbedding = await embed_tags([inputText]);
          
          // Generate embeddings for all tags
          const tagTexts = tags.map((t: {tag: string}) => t.tag);
          const tagEmbeddings = await embed_tags(tagTexts);
          
          // Calculate similarity scores
          const matches = [];
          for (let i = 0; i < tagTexts.length; i++) {
            // Create a tensor from the embedding
            const inputTensor = new ort.Tensor('float32', new Float32Array(inputEmbedding[0].data), inputEmbedding[0].dims);
            const tagTensor = new ort.Tensor('float32', new Float32Array(tagEmbeddings[i].data), tagEmbeddings[i].dims);
            
            // Calculate similarity
            const similarity = await computeTensorSimilarity(inputTensor, tagTensor);
            
            matches.push({
              tag: tags[i].tag,
              type: tags[i].type,
              anchor: tags[i].anchor,
              score: similarity
            });
          }
          
          // Sort by similarity score (descending) and take top 3
          const topMatches = matches
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
          
          // Send response back to UI
          chrome.runtime.sendMessage({
            type: MessageType.TAG_MATCH_RESPONSE,
            data: { matches: topMatches }
          });
        } catch (error) {
          console.error('Error in tag matching:', error);
          chrome.runtime.sendMessage({
            type: MessageType.TAG_MATCH_RESPONSE,
            data: { 
              matches: [],
              error: error instanceof Error ? error.message : String(error)
            }
          });
        }
      })();
      return true; // Indicates async response
    }
  });
  
  console.log('Tag matching listener registered');
}

// Add this function
export function registerSearchMessageListener() {
  // Listen for messages from content scripts
  chrome.runtime.onMessage.addListener((
    message: ExtensionRequest, 
    sender, 
    sendResponse: (response: ExtensionResponse) => void
  ) => {
    if (message.type === MessageType.NEW_SEARCH) {
      try {
        console.log('NEW_SEARCH received:', message.data);
        contextDb.storeSearch(message.data.query)
          .then(() => {
            console.log('Search stored successfully, notifying popup');
            // Send message to all extension pages
            chrome.runtime.sendMessage({
              type: MessageType.SEARCHES_UPDATED,
              data: {}
            });
          })
          .catch((error) => {
            console.error('Error storing search:', error);
          });
      } catch (error) {
        console.error('Error processing message:', error);
      }
      return true;
    }
  });
  
  console.log('Search message listener registered');
}


registerTagMessageListener();
registerPersonalizeMessageListener();
registerTagMatchingListener();
registerSearchMessageListener();