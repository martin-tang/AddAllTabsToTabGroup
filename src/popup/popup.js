function applyColorScheme() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    document.body.style.backgroundColor = isDark ? '#202124' : '#f3f4f6';
    document.body.style.color = isDark ? '#e8eaed' : '#202124';

    // Set heading color with better contrast
    const heading = document.querySelector('h1');
    if (heading) {
        heading.style.color = isDark ? '#ffffff' : '#1f1f1f';
    }

    // Update button styles dynamically
    const style = document.createElement('style');
    const buttonHoverColor = isDark ? '#2c2c2c' : '#e5e5e5';
    const primaryButtonColor = isDark ? '#8ab4f8' : '#1a73e8';
    const primaryButtonHoverColor = isDark ? '#93baf9' : '#1557b0';
    
    style.textContent = `
        button {
            background: ${isDark ? '#303030' : '#f5f5f5'};
            color: ${isDark ? '#e8eaed' : '#202124'};
            border-color: ${isDark ? '#5f6368' : '#ccc'};
        }
        button:hover {
            background: ${buttonHoverColor};
        }
        .primary-button {
            background: ${primaryButtonColor};
            color: ${isDark ? '#202124' : 'white'};
            border: none;
        }
        .primary-button:hover {
            background: ${primaryButtonHoverColor};
        }
    `;
    document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', function() {
    const convertToGroupButton = document.getElementById('convert-to-group');
    const openSidebarButton = document.getElementById('open-sidebar');
    const popupWindow = window; // Store reference to popup window

    // Apply initial color scheme
    applyColorScheme();

    // Listen for color scheme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        applyColorScheme();
    });

    convertToGroupButton.addEventListener('click', function() {
        chrome.tabs.query({ currentWindow: true }, function(tabs) {
            const tabIds = tabs.map(tab => tab.id);
            chrome.tabs.group({ tabIds: tabIds }, function(groupId) {
                chrome.tabGroups.update(groupId, { title: '' });
                popupWindow.close(); // Close popup after action
            });
        });
    });

    openSidebarButton.addEventListener('click', function() {
        chrome.windows.getCurrent(function(chromeWindow) {
            chrome.sidePanel.open({ windowId: chromeWindow.id });
            popupWindow.close(); // Close popup after action
        });
    });
});