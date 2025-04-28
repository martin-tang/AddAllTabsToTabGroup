// Background script for handling extension functionality
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });

// Create context menu items when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Extension icon context menu
  chrome.contextMenus.create({
    id: "showSidebar",
    title: "Show Tab Groups Panel",
    contexts: ["action"]
  });

  // Context menu for tabs
  chrome.contextMenus.create({
    id: "addWindowToGroup",
    title: "Add window to tab group",
    contexts: ["all"]
  });
});

// Handle icon click - create tab group from current window
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.query({ currentWindow: true }, async (tabs) => {
    try {
      const tabIds = tabs.map(tab => tab.id);
      const groupId = await chrome.tabs.group({ tabIds: tabIds });
      await chrome.tabGroups.update(groupId, { title: '' });
      // Give Chrome a moment to update its internal state
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error creating tab group:', error);
    }
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "showSidebar") {
    chrome.windows.getCurrent((window) => {
      chrome.sidePanel.open({ windowId: window.id });
    });
  } else if (info.menuItemId === "addWindowToGroup" && info.pageUrl) {
    // Only process if we have a valid tab (info.pageUrl indicates we're on a tab)
    chrome.tabs.query({ windowId: tab.windowId }, async (tabs) => {
      try {
        const tabIds = tabs.map(tab => tab.id);
        const groupId = await chrome.tabs.group({ tabIds: tabIds });
        await chrome.tabGroups.update(groupId, { title: '' });
        // Give Chrome a moment to update its internal state
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error creating tab group:', error);
      }
    });
  }
});