// Handle color scheme
function applyColorScheme() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    document.body.style.backgroundColor = isDark ? '#202124' : '#f3f4f6';
    document.body.style.color = isDark ? '#e8eaed' : '#202124';
    
    const treeContainer = document.getElementById('tree-container');
    if (treeContainer) {
        treeContainer.style.color = isDark ? '#e8eaed' : '#202124';
    }

    const style = document.createElement('style');
    const hoverColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    style.textContent = `
        .tab-item:hover {
            background-color: ${hoverColor};
        }
    `;
    document.head.appendChild(style);
}

// Debounce function to prevent multiple rapid calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Get random color from Chrome's supported colors
function getRandomColor() {
    const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Create a new tab group from window tabs
async function createTabGroup(windowId, tabs) {
    try {
        const groupId = await chrome.tabs.group({ tabIds: tabs.map(tab => tab.id) });
        await chrome.tabGroups.update(groupId, {
            title: '',
            color: getRandomColor()
        });
        
        // Give Chrome a moment to update its internal state
        setTimeout(async () => {
            await buildTree();
        }, 100);
    } catch (error) {
        console.error('Error creating tab group:', error);
    }
}

// Create tab group element
function createTabGroupElement(group, tabs) {
    const groupElement = document.createElement('div');
    groupElement.className = 'tab-group';
    
    const header = document.createElement('div');
    header.className = 'tab-group-header';
    
    const colorDot = document.createElement('span');
    colorDot.className = 'tab-group-color';
    colorDot.style.backgroundColor = group.color;
    
    const title = document.createElement('span');
    title.textContent = group.title;
    
    header.appendChild(colorDot);
    header.appendChild(title);
    groupElement.appendChild(header);
    
    // Add click handler to ungroup tabs when clicking the header
    header.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent window click handler from firing
        try {
            const tabIds = tabs.map(tab => tab.id);
            await chrome.tabs.ungroup(tabIds);
            // Give Chrome a moment to update its internal state
            setTimeout(async () => {
                await buildTree();
            }, 100);
        } catch (error) {
            console.error('Error ungrouping tabs:', error);
        }
    });
    
    const tabList = document.createElement('div');
    tabList.className = 'tab-list';
    
    tabs.forEach(tab => {
        const tabElement = createTabElement(tab);
        tabList.appendChild(tabElement);
    });
    
    groupElement.appendChild(tabList);
    return groupElement;
}

// Create tab element
function createTabElement(tab) {
    const tabElement = document.createElement('div');
    tabElement.className = 'tab-item';

    if (tab.favIconUrl) {
        const favicon = document.createElement('img');
        favicon.className = 'tab-favicon';
        favicon.src = tab.favIconUrl;
        favicon.onerror = () => favicon.style.display = 'none';
        tabElement.appendChild(favicon);
    }

    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = tab.title;
    tabElement.appendChild(title);

    tabElement.addEventListener('click', () => {
        chrome.tabs.update(tab.id, { active: true });
        chrome.windows.update(tab.windowId, { focused: true });
    });

    return tabElement;
}

// Build the tree view structure
async function buildTree() {
    const windows = await chrome.windows.getAll({ populate: true });
    const container = document.getElementById('tree-container');
    container.innerHTML = '';

    for (const window of windows) {
        const windowElement = document.createElement('div');
        windowElement.className = 'window-item';

        const windowHeader = document.createElement('div');
        windowHeader.className = 'window-header';
        windowHeader.textContent = `Window (${window.tabs.length} tabs)`;
        
        const tabList = document.createElement('div');
        tabList.className = 'tab-list';

        // Group tabs by their group
        const groupedTabs = new Map();
        const ungroupedTabs = [];

        // First pass: organize tabs into groups
        for (const tab of window.tabs) {
            if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
                if (!groupedTabs.has(tab.groupId)) {
                    groupedTabs.set(tab.groupId, []);
                }
                groupedTabs.get(tab.groupId).push(tab);
            } else {
                ungroupedTabs.push(tab);
            }
        }

        // Add grouped tabs first
        for (const [groupId, tabs] of groupedTabs) {
            try {
                const group = await chrome.tabGroups.get(groupId);
                const groupElement = createTabGroupElement(group, tabs);
                tabList.appendChild(groupElement);
            } catch (error) {
                console.warn(`Group ${groupId} no longer exists, skipping...`);
                // Add these tabs to ungrouped since their group is gone
                ungroupedTabs.push(...tabs);
            }
        }

        // Add ungrouped tabs
        for (const tab of ungroupedTabs) {
            const tabElement = createTabElement(tab);
            tabList.appendChild(tabElement);
        }

        // Add click handler if the window has any tabs (grouped or ungrouped)
        if (window.tabs.length > 0) {
            windowElement.addEventListener('click', async (e) => {
                // Only create group if clicking the window item itself or header
                if (e.target === windowElement || e.target === windowHeader) {
                    try {
                        // Collect all tab IDs first
                        const allTabIds = window.tabs.map(tab => tab.id);
                        
                        // Ungroup any grouped tabs in a single operation
                        const groupedTabIds = window.tabs
                            .filter(tab => tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE)
                            .map(tab => tab.id);
                        
                        if (groupedTabIds.length > 0) {
                            await chrome.tabs.ungroup(groupedTabIds);
                        }

                        // Create new group with all tabs
                        await createTabGroup(window.id, window.tabs);
                    } catch (error) {
                        console.error('Error combining groups:', error);
                    }
                }
            });
        }

        windowElement.appendChild(windowHeader);
        windowElement.appendChild(tabList);
        
        // Only add the window to the tree if it has any content
        if (ungroupedTabs.length > 0 || groupedTabs.size > 0) {
            container.appendChild(windowElement);
        }
    }
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    applyColorScheme();
    buildTree();
});

// Listen for color scheme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    applyColorScheme();
});

// Debounced buildTree function
const debouncedBuildTree = debounce(buildTree, 150);

// Listen for tab changes
chrome.tabs.onCreated.addListener(debouncedBuildTree);
chrome.tabs.onRemoved.addListener(debouncedBuildTree);
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.title || changeInfo.favIconUrl) {
        debouncedBuildTree();
    }
});

// Listen for tab group changes
chrome.tabGroups.onCreated.addListener(debouncedBuildTree);
chrome.tabGroups.onUpdated.addListener(debouncedBuildTree);
chrome.tabGroups.onRemoved.addListener(debouncedBuildTree);

// Listen for window changes
chrome.windows.onCreated.addListener(debouncedBuildTree);
chrome.windows.onRemoved.addListener(debouncedBuildTree);
chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId !== chrome.windows.WINDOW_ID_NONE) {
        debouncedBuildTree();
    }
});