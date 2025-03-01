import { ExtensionServiceWorkerMLCEngineHandler } from "@mlc-ai/web-llm";
import { isFeatureEnabled } from '../utils/featureFlags';

let mlcHandler: ExtensionServiceWorkerMLCEngineHandler | undefined;

if (isFeatureEnabled('chat_interface')) {
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
  