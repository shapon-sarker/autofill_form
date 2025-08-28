document.addEventListener("DOMContentLoaded", () => {
    let profileSelect = document.getElementById("profileSelect");
    let newProfileName = document.getElementById("newProfileName");
    
    // Show notifications to users
    function showNotification(message, type = 'success') {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.querySelector('.main-content').appendChild(notification);
        }
        
        // Set message and type
        notification.textContent = message;
        notification.className = `notification ${type}`;
        
        // Show notification
        notification.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    function updateProfiles() {
        chrome.storage.local.get("profiles", res => {
            let profiles = res.profiles || {};
            profileSelect.innerHTML = "";
            
            if (Object.keys(profiles).length === 0) {
                let opt = document.createElement("option");
                opt.value = "";
                opt.textContent = "No profiles saved";
                opt.disabled = true;
                profileSelect.appendChild(opt);
                document.getElementById("loadBtn").disabled = true;
                document.getElementById("deleteBtn").disabled = true;
            } else {
                Object.keys(profiles).forEach(p => {
                    let opt = document.createElement("option");
                    opt.value = p;
                    opt.textContent = p;
                    profileSelect.appendChild(opt);
                });
                document.getElementById("loadBtn").disabled = false;
                document.getElementById("deleteBtn").disabled = false;
            }
        });
    }

    document.getElementById("newProfileBtn").onclick = () => {
        let name = newProfileName.value.trim();
        if (name) {
            chrome.storage.local.get("profiles", res => {
                let profiles = res.profiles || {};
                
                // Check if profile already exists
                if (profiles[name]) {
                    showNotification('Profile name already exists!', 'error');
                    return;
                }
                
                profiles[name] = {};
                chrome.storage.local.set({ profiles }, () => {
                    updateProfiles();
                    profileSelect.value = name;
                    newProfileName.value = "";
                    showNotification('New profile created successfully!');
                });
            });
        } else {
            showNotification('Please enter a profile name', 'error');
        }
    };

    document.getElementById("saveBtn").onclick = () => {
        const selectedProfile = profileSelect.value;
        if (!selectedProfile) {
            showNotification('Please select or create a profile first', 'error');
            return;
        }
        
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: "saveInputs",
                profile: selectedProfile
            }, response => {
                if (response && response.success) {
                    showNotification('Form data saved successfully!');
                } else {
                    showNotification('No form data found on this page', 'error');
                }
            });
        });
    };

    document.getElementById("loadBtn").onclick = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: "loadInputs",
                profile: profileSelect.value
            }, response => {
                if (response && response.success) {
                    showNotification('Form data loaded successfully!');
                } else {
                    showNotification('No saved data for this profile', 'error');
                }
            });
        });
    };

    document.getElementById("deleteBtn").onclick = () => {
        let profile = profileSelect.value;
        
        // Confirm before deleting
        if (confirm(`Are you sure you want to delete the profile "${profile}"?`)) {
            chrome.storage.local.get("profiles", res => {
                let profiles = res.profiles || {};
                delete profiles[profile];
                chrome.storage.local.set({ profiles }, () => {
                    updateProfiles();
                    showNotification('Profile deleted successfully!');
                });
            });
        }
    };

    // Add keyboard shortcuts
    newProfileName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById("newProfileBtn").click();
        }
    });

    // Initialize
    updateProfiles();
    
    // Add version info
    const versionElement = document.createElement('div');
    versionElement.className = 'version';
    versionElement.textContent = 'v1.0';
    document.querySelector('footer').appendChild(versionElement);
});