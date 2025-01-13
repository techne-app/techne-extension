export async function getChatCompletion(messages: any[], stream = false) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'CHAT_COMPLETION',
      messages,
      stream
    }, (response) => {
      if (response.type === 'ERROR') {
        reject(new Error(response.error));
      } else if (response.type === 'COMPLETE') {
        resolve(response.content);
      }
    });
  });
}

// For streaming responses
export async function* streamChatCompletion(messages: any[]) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'CHAT_COMPLETION',
      messages,
      stream: true
    }, function* (response) {
      if (response.type === 'ERROR') {
        reject(new Error(response.error));
      } else if (response.type === 'STREAM_CHUNK') {
        yield response.content;
      } else if (response.type === 'COMPLETE') {
        resolve(response.content);
      }
    });
  });
} 