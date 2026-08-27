chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'https://marketplace.visualstudio.com/items?itemName=im-anishraj.inspectai-ide-companion' });
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_INSPECTAI' }).catch(err => {
      console.warn("InspectAI: Could not send toggle message. Is it a localhost tab?", err);
    });
  }
});
