chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_INSPECTAI' }).catch(err => {
      console.warn("InspectAI: Could not send toggle message.", err);
      
      // If message fails and it's not localhost, show a helpful alert
      if (tab.url && !tab.url.startsWith('http://localhost') && !tab.url.startsWith('http://127.0.0.1')) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            alert("🔍 InspectAI only works on local development servers (e.g., http://localhost:3000).\n\nPlease open your local React/Next.js app to start vibe coding!");
          }
        }).catch(e => console.error("Could not inject alert:", e));
      }
    });
  }
});
