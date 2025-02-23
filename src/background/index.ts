import { tagDb } from './db';
import { CONFIG } from '../config';
import { ExtensionServiceWorkerMLCEngineHandler } from "@mlc-ai/web-llm";
import { 
  MessageType, 
  ExtensionRequest, 
  ExtensionResponse,
  ChatCompletionRequest 
} from '../types/messages';

let mlcHandler: ExtensionServiceWorkerMLCEngineHandler | undefined;

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

  if (message.type === MessageType.CHAT_COMPLETION && mlcHandler) {
    (async () => {
      try {
        const completion = await mlcHandler.engine.chat.completions.create({
          messages: message.data.messages,
          stream: true,
          temperature: message.data.temperature || 1.0,
          max_tokens: message.data.max_tokens || 256
        });

        if (message.data.stream) {
          let fullResponse = '';
          const stream = await completion;
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              fullResponse += delta;
              sendResponse({ 
                type: MessageType.STREAM_CHUNK, 
                data: { content: delta }
              });
            }
          }
          sendResponse({ 
            type: MessageType.COMPLETE, 
            data: { content: fullResponse }
          });
        } else {
          let fullResponse = '';
          for await (const chunk of completion) {
            fullResponse += chunk.choices[0]?.delta?.content || '';
          }
          sendResponse({ 
            type: MessageType.COMPLETE, 
            data: { content: fullResponse }
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

  if (message.type === MessageType.RANK_TAGS && mlcHandler) {
    (async () => {
      try {
        // Get historical tags directly from DB
        const historicalTags = await tagDb.getAllTags();
        const historicalTagStrings = historicalTags.map(t => t.tag);
        
        const { storyTags, tagTypes, tagAnchors } = message.data;
        
        const prompt = `Given:
                      Historical tags: [${historicalTagStrings.join(', ')}]
                      Story tags: [${storyTags.join(', ')}]

                      Select exactly 3 story tags most similar to historical tags.
                      Reply only with tags separated by commas.`;

        const completion = await mlcHandler.engine.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          stream: true,
          temperature: 0.7,
          max_tokens: 128
        });

        let response = '';
        const stream = await completion;
        for await (const chunk of stream) {
          response += chunk.choices[0]?.delta?.content || '';
        }

        const selectedTags = response.split(',').map(t => t.trim());
        
        // Map back to full tag data
        const result = { tags: [] as string[], types: [] as string[], anchors: [] as string[] };
        selectedTags.forEach(tag => {
            const index = storyTags.findIndex(t => t === tag);
            if (index !== -1) {
                result.tags.push(storyTags[index]);
                result.types.push(tagTypes[index]);
                result.anchors.push(tagAnchors[index]);
            }
        });

        sendResponse({ 
          type: MessageType.RANK_TAGS_COMPLETE, 
          data: { result }
        });
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