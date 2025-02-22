import { 
  MessageType, 
  ExtensionResponse, 
  ChatCompletionRequest 
} from '../types/messages';

export async function getChatCompletion(messages: any[], stream = false) {
  return new Promise((resolve, reject) => {
    const request: ChatCompletionRequest = {
      type: MessageType.CHAT_COMPLETION,
      data: {
        messages,
        stream,
      }
    };

    chrome.runtime.sendMessage(request, (response: ExtensionResponse) => {
      if (response.type === MessageType.ERROR) {
        reject(new Error(response.data.error));
      } else if (response.type === MessageType.COMPLETE) {
        resolve(response.data.content);
      }
    });
  });
}

// For streaming responses
export async function* streamChatCompletion(messages: any[]) {
  return new Promise((resolve, reject) => {
    const request: ChatCompletionRequest = {
      type: MessageType.CHAT_COMPLETION,
      data: {
        messages,
        stream: true
      }
    };

    chrome.runtime.sendMessage(request, function* (response: ExtensionResponse) {
      if (response.type === MessageType.ERROR) {
        reject(new Error(response.data.error));
      } else if (response.type === MessageType.STREAM_CHUNK) {
        yield response.data.content;
      } else if (response.type === MessageType.COMPLETE) {
        resolve(response.data.content);
      }
    });
  });
} 