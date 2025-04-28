// Background script for handling extension functionality
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });

// Create context menu item when extension is installed
// chrome.runtime.onInstalled.addListener(() => {
//   chrome.contextMenus.create({
//     id: "showSidebar",
//     title: "Show Tab Groups Panel",
//     contexts: ["action"]
//   });
// });

// Handle icon click - create tab group from current window
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    const tabIds = tabs.map(tab => tab.id);
    chrome.tabs.group({ tabIds: tabIds }, (groupId) => {
      chrome.tabGroups.update(groupId, { title: '' });
    });
  });
});

// Handle context menu click - open sidebar
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "showSidebar") {
    chrome.windows.getCurrent((window) => {
      chrome.sidePanel.open({ windowId: window.id });
    });
  }
});