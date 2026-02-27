async function toggleSpeechToText() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) return;

  try {
    await chrome.tabs.sendMessage(activeTab.id, { command: "toggleRecognition" });
  } catch (e) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ["content.js"],
      });
      await new Promise((r) => setTimeout(r, 100));
      await chrome.tabs.sendMessage(activeTab.id, { command: "toggleRecognition" });
    } catch (e2) {
      // Page doesn't allow content scripts
    }
  }
}

chrome.action.onClicked.addListener(() => {
  toggleSpeechToText();
});
