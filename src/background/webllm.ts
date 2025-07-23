import { ExtensionServiceWorkerMLCEngineHandler } from "@mlc-ai/web-llm";
import { logger } from '../utils/logger';

let mlcHandler: ExtensionServiceWorkerMLCEngineHandler | undefined;

// Set up the connection listener for WebLLM
chrome.runtime.onConnect.addListener(async function (port) {
  if (port.name === "web_llm_service_worker") {
    try {
      // Always create new handler for fresh connections to avoid port disconnection issues
      mlcHandler = new ExtensionServiceWorkerMLCEngineHandler(port);
      port.onMessage.addListener(mlcHandler.onmessage.bind(mlcHandler));
      
      // Handle port disconnection to reset handler
      port.onDisconnect.addListener(() => {
        logger.debug('WebLLM port disconnected, awaiting reconnection');
        mlcHandler = undefined; // Reset handler to force recreation on next connection
      });
      
      logger.info('WebLLM handler initialized successfully');
    } catch (error) {
      logger.error('Error initializing WebLLM handler:', error);
    }
  }
});
  