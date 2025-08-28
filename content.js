(function () {
    let currentProfile = "default";

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.type === "saveInputs") {
            const success = saveInputs(msg.profile);
            sendResponse({ success });
        }
        if (msg.type === "loadInputs") {
            const success = loadInputs(msg.profile);
            sendResponse({ success });
        }
        return true; // Keep the message channel open for sendResponse
    });

    function saveInputs(profile) {
        let inputs = document.querySelectorAll("input, textarea, select");
        let data = {};
        let hasData = false;
        
        inputs.forEach(input => {
            // Skip hidden, submit, button, and password inputs
            if (input.type !== "password" && 
                input.type !== "submit" && 
                input.type !== "button" && 
                input.type !== "hidden" &&
                (input.name || input.id)) {
                
                // Handle checkboxes and radio buttons
                if (input.type === "checkbox" || input.type === "radio") {
                    data[input.name || input.id] = input.checked;
                } else {
                    data[input.name || input.id] = input.value;
                }
                hasData = true;
            }
        });
        
        if (!hasData) {
            return false;
        }
        
        chrome.storage.local.get("profiles", res => {
            let profiles = res.profiles || {};
            profiles[profile] = data;
            chrome.storage.local.set({ profiles }, () => {
                sendToast(`Profile "${profile}" saved successfully!`, "success");
            });
        });
        
        return true;
    }

    function loadInputs(profile) {
        chrome.storage.local.get("profiles", res => {
            let profiles = res.profiles || {};
            let data = profiles[profile] || {};
            
            if (Object.keys(data).length === 0) {
                sendToast(`No data found for profile "${profile}"`, "error");
                return false;
            }
            
            for (let key in data) {
                let elements = document.querySelectorAll(`[name='${key}'], #${key}`);
                
                elements.forEach(el => {
                    if (el.type === "checkbox" || el.type === "radio") {
                        el.checked = data[key];
                    } else {
                        el.value = data[key];
                        // Trigger change event for dynamic forms
                        const event = new Event('change', { bubbles: true });
                        el.dispatchEvent(event);
                    }
                });
            }
            
            sendToast(`Profile "${profile}" loaded successfully!`, "success");
            return true;
        });
        
        return true;
    }

    function sendToast(msg, type = "success") {
        let div = document.createElement("div");
        div.innerText = msg;
        div.style.position = "fixed";
        div.style.bottom = "20px";
        div.style.right = "20px";
        div.style.padding = "12px 20px";
        div.style.borderRadius = "8px";
        div.style.zIndex = "99999";
        div.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
        div.style.fontSize = "14px";
        div.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        
        if (type === "success") {
            div.style.background = "#4776E6";
            div.style.color = "#fff";
        } else {
            div.style.background = "#dc3545";
            div.style.color = "#fff";
        }
        
        document.body.appendChild(div);
        
        // Fade in animation
        div.style.opacity = "0";
        div.style.transition = "opacity 0.3s ease";
        
        setTimeout(() => {
            div.style.opacity = "1";
        }, 10);
        
        // Fade out and remove
        setTimeout(() => {
            div.style.opacity = "0";
            setTimeout(() => div.remove(), 300);
        }, 3000);
    }
})();