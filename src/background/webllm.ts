import { ExtensionServiceWorkerMLCEngineHandler } from "@mlc-ai/web-llm";
import { isChatInterfaceEnabled } from '../utils/featureFlags';

let mlcHandler: ExtensionServiceWorkerMLCEngineHandler | undefined;

// Always set up the connection listener, but check feature flag inside
chrome.runtime.onConnect.addListener(async function (port) {
  if (port.name === "web_llm_service_worker") {
    const chatEnabled = await isChatInterfaceEnabled();
    
    if (!chatEnabled) {
      console.log('Chat interface is disabled');
      return;
    }
    
    try {
      // Always create new handler for fresh connections to avoid port disconnection issues
      mlcHandler = new ExtensionServiceWorkerMLCEngineHandler(port);
      port.onMessage.addListener(mlcHandler.onmessage.bind(mlcHandler));
      
      // Handle port disconnection to reset handler
      port.onDisconnect.addListener(() => {
        console.log('WebLLM port disconnected, awaiting reconnection');
        mlcHandler = undefined; // Reset handler to force recreation on next connection
      });
      
      console.log('WebLLM handler initialized successfully');
    } catch (error) {
      console.error('Error initializing WebLLM handler:', error);
    }
  }
});
  