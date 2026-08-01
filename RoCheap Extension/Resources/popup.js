document.addEventListener('DOMContentLoaded', async () => {
    const placeInput = document.getElementById("placeId");
    const saveBtn = document.getElementById("saveBtn");
    const priceDisplay = document.getElementById("priceDisplay");
    const buyBtn = document.getElementById("buyBtn");
    const statusMsg = document.getElementById("statusMessage");
    
    // UI Logic: Dropdown Toggle
    const configToggle = document.getElementById("configToggle");
    const configBody = document.getElementById("configBody");
    
    configToggle.addEventListener("click", () => {
        configToggle.classList.toggle("open");
        configBody.style.display = configBody.style.display === "block" ? "none" : "block";
    });

    // Load saved Place ID
    chrome.storage.sync.get("placeId", (res) => {
        if (res.placeId) placeInput.value = res.placeId;
    });

    // Save Place ID
    saveBtn.addEventListener("click", () => {
        const val = placeInput.value.trim();
        if (!val) return;
        chrome.storage.sync.set({ placeId: val }, () => {
            const originalBg = saveBtn.style.background;
            const originalText = saveBtn.innerText;
            saveBtn.style.background = "#3ba55c";
            saveBtn.innerText = "Saved ✓";
            setTimeout(() => {
                saveBtn.style.background = originalBg;
                saveBtn.innerText = originalText;
                configToggle.click();
            }, 1000);
        });
    });

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Matches /catalog/, /bundles/, and /game-pass/
    const match = tab?.url?.match(/\/(?:catalog|bundles|game-pass|game-passes)\/(\d+)/i);
    
    if (tab && match) {
        const assetId = match[1];
        let attempts = 0;
        const maxAttempts = 20;

        // This function will be injected directly into Roblox to scrape the price
        function scrapeRobloxPrice() {
            const selectors = [
                ".text-robux-lg",          
                ".text-robux-tile",
                "[data-testid='item-detail-price']",
                ".item-price-value",
                ".game-pass-price",        
                "#item-price",
                ".price-container span[class*='text-robux']"
            ];

            let rawText = "";

            for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el && el.innerText.trim() !== "") {
                    rawText = el.innerText;
                    break;
                }
            }

            if (!rawText) {
                const fallback = document.querySelector(".price-container, .item-price-container, [data-testid='price-container']");
                if (fallback) rawText = fallback.innerText;
            }

            if (!rawText) return null;

            // Strip local currency out
            const cleanText = rawText.replace(/\([^)]+\)/g, "");
            const match = cleanText.match(/([\d,]+)/);
            if (match) {
                const price = parseInt(match[1].replace(/,/g, ""), 10);
                if (price > 0) return price;
            }
            return null;
        }

        async function fetchPrice() {
            try {
                // EXECUTING DIRECTLY - No messaging used!
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: scrapeRobloxPrice
                });

                const price = results[0].result;

                if (!price) throw new Error("Price not found");

                // EXACT 40% OFF LOGIC
                const discounted = Math.round(price * 0.6);
                priceDisplay.innerText = `40% Off Price: ${discounted} R$`;
                
                buyBtn.disabled = false;
                buyBtn.style.opacity = "1";
            } catch (err) {
                attempts++;
                if (attempts < maxAttempts) {
                    priceDisplay.innerText = `Scanning Page...`;
                    setTimeout(fetchPrice, 500);
                } else {
                    priceDisplay.innerText = "Item is Free or Off-Sale";
                    buyBtn.innerText = "Unavailable";
                }
            }
        }

        fetchPrice();

        buyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(assetId).then(() => {
                chrome.storage.sync.get("placeId", (res) => {
                    if (res.placeId) {
                        
                        // INJECTING REDIRECT DIRECTLY - No messaging used!
                        chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            func: (pid) => { window.location.href = `roblox://placeId=${pid}`; },
                            args: [res.placeId]
                        }).catch(() => {}); // Silently catch if the tab closes instantly
                        
                        statusMsg.style.display = "block";
                        buyBtn.disabled = true;
                        buyBtn.style.opacity = "0.5";
                        
                        setTimeout(() => {
                            statusMsg.style.display = "none";
                            buyBtn.disabled = false;
                            buyBtn.style.opacity = "1";
                        }, 2500);
                    } else {
                        if(configBody.style.display !== "block") configToggle.click();
                        alert("Please set a Place ID first!");
                    }
                });
            }).catch(err => console.error("Clipboard error:", err));
        });
    } else {
        priceDisplay.innerText = "Open a Catalog, Bundle, or Game Pass!";
        buyBtn.innerText = "Waiting for Item...";
    }
});