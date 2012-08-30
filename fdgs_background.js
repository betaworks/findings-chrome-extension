chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.url && request.title && request.content){
            var notification = showNotification('Posting Clip to Findings...');
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: config.findingsBaseURL + '/clips/enterclip/',
                data: request,
                success: function(data){ handleResponse(data, notification)},
                error: function(jqXHR){ handleError(data, notification)}
            });
        }
    }
);

var handleResponse = function(data, clippingNotification){
    clippingNotification.close();
    if (data.success){
        showNotification('Posted Clip to Findings', data.clip_content, 5000);
    } else {
        showNotification('Clip was not Posted', data.message, 5000);
    }
}

var handleError = function(jqXHR, clippingNotification){
    clipping_notification.close();
    notification = showNotification('Clip was not Posted', 'There was an error tyring to reach the findings service. Please make sure you are logged in.', 5000);
}

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
function showNotification(title, body, ttl) {
    if (config.desktopNotificationsEnabled){
        var notification = webkitNotifications.createNotification('icon-48x48.png', title || "", body || "");
        notification.show();

        function closeNotice(){
            notification.cancel();
        }

        if (typeof(ttl) !== 'undefined'){
            setTimeout(closeNotice, ttl);
        }

        return notification
    }
}

// The rest of this is all about amazon auto importing.
function doAmazonSync(){
    var now = new Date().getTime();
    var diff = now - config.lastAmazonSyncDate.getTime();
    var until = config.amazonSyncInterval - diff;
    if (config.amazonSyncInterval > 0 && until <= 0 && !KindleSync.isRunning){
        KindleSync.sync();
    }
}

function onDomReady(){
    // Start the sync
    setInterval(doAmazonSync, 60000);

    if(config.extensionFirstRun) {
        chrome.tabs.create({ url: chrome.extension.getURL('options.html') })
        config.extensionFirstRun = false;
    }

}

$(onDomReady)
