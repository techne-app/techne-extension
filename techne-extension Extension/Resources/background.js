chrome.action.onClicked.addListener(async () => {
    const url = chrome.runtime.getURL('index.html');
    
    // Find existing tab with our URL
    const existingTabs = await chrome.tabs.query({ url });
    
    if (existingTabs.length > 0) {
      // If tab exists, focus on it
      await chrome.tabs.update(existingTabs[0].id, { active: true });
      await chrome.windows.update(existingTabs[0].windowId, { focused: true });
    } else {
      // If no tab exists, create new one
      await chrome.tabs.create({ url });
    }
  });