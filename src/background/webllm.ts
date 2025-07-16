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
      if (mlcHandler === undefined) {
        mlcHandler = new ExtensionServiceWorkerMLCEngineHandler(port);
      } else {
        mlcHandler.setPort(port);
      }
      port.onMessage.addListener(mlcHandler.onmessage.bind(mlcHandler));
      console.log('WebLLM handler initialized successfully');
    } catch (error) {
      console.error('Error initializing WebLLM handler:', error);
    }
  }
});
  