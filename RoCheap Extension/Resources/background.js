chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get("placeId", res => {
        // chrome.action.openPopup() isn't supported by Safari Web Extensions,
        // so this is a no-op there; users open the popup manually.
        if (!res.placeId && chrome.action.openPopup) {
            chrome.action.openPopup().catch(() => {});
        }
    });
});
