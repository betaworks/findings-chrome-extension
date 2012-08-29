// Add the bookmarklet to the current page. This is all we need to do to get
// the clipping functionality working.
chrome.browserAction.onClicked.addListener(function(tab) {
    var injectBookmarklet = "";
    injectBookmarklet += "var e=document.createElement('script');";
    injectBookmarklet += "e.setAttribute('id', 'fdgs_chrome_extension');";
    injectBookmarklet += "e.setAttribute('src', '" + config.findingsBaseURL + "/extension/loader');";
    injectBookmarklet += "document.body.appendChild(e);";

    chrome.tabs.executeScript(null, {
        code: injectBookmarklet
    });
});


// Some helper functions
function showNotification(title, body) {
    if (config.desktopNotificationsEnabled){
        var n = webkitNotifications.createNotification('icon-48x48.png', title || "", body || "");
        n.show();
        return n
    }
}

// The rest of this is all about amazon auto importing.
function doAmazonSync(){
    var now = new Date().getTime();
    var diff = now - config.lastAmazonSyncDate.getTime();
    var until = config.amazonSyncInterval - diff;
    if (until <= 0 && !KindleSync.isRunning){
        KindleSync.sync();
    } else {
        console.log('Millis until next sync:', until);
    }
}

function onDomReady(){
    // Start the sync
    setInterval(doAmazonSync, 5000);

    if(config.extensionFirstRun) {
        chrome.tabs.create({ url: chrome.extension.getURL('options.html') })
        config.extensionFirstRun = false;
    }

}

$(onDomReady)
