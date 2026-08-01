chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get("placeId", res => {
        if (!res.placeId) chrome.action.openPopup();
    });
});
