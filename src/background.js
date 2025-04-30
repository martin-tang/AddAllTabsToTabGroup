// Background script for handling extension functionality
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });

// Get random color from Chrome's supported colors
function getRandomColor() {
    const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Create context menu items when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Extension icon context menu
//   chrome.contextMenus.create({
//     id: "showSidebar",
//     title: "Show Tab Groups Panel",
//     contexts: ["action"]
//   });

  // Context menu for pages
  chrome.contextMenus.create({
    id: "addWindowToGroup",
    title: "Create Tab Group from Window",
    contexts: ["page"]
  });
});

// Handle icon click - create tab group from current window or ungroup if all tabs are grouped
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.query({ currentWindow: true }, async (tabs) => {
    try {
      // Check if all tabs are in the same group
      const groupIds = tabs.map(tab => tab.groupId);
      const uniqueGroupIds = [...new Set(groupIds)];
      
      // If all tabs are in the same group (not -1 which means ungrouped)
      if (uniqueGroupIds.length === 1 && uniqueGroupIds[0] !== -1) {
        // Ungroup all tabs
        await chrome.tabs.ungroup(tabs.map(tab => tab.id));
      } else {
        // Create new group
        const tabIds = tabs.map(tab => tab.id);
        const groupId = await chrome.tabs.group({ tabIds: tabIds });
        await chrome.tabGroups.update(groupId, { 
          title: '',
          color: getRandomColor()
        });
        // Give Chrome a moment to update its internal state
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error managing tab group:', error);
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
        await chrome.tabGroups.update(groupId, { 
          title: '',
          color: getRandomColor()
        });
        // Give Chrome a moment to update its internal state
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error creating tab group:', error);
      }
    });
  }
});