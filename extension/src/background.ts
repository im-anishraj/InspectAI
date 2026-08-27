chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_INSPECTAI' }).catch(err => {
      console.warn("InspectAI: Could not send toggle message. Is it a localhost tab?", err);
    });
  }
});
