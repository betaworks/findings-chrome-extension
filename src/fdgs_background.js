var whitelist

chrome.extension.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action == 'loadBookmarklet'){
            injectBookmarkletIntoPage();
        } else if (request.action === 'getWhitelist') {
            var response = {'whitelist': whitelist};
            sendResponse(response);
        } else if (request.action === 'checkInlineHighlightingEnabled') {
            var response = {
                'inlineHighlightingEnabled': config.inlineHighlightingEnabled,
                'whitelist': whitelist
            };
            sendResponse(response);
        } else if (request.url && request.title && request.content){
            var notification = showNotification('Posting Clip to Findings...');
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: config.findingsBaseURL + '/clips/enterclip/',
                data: request,
                success: function(data){ handleResponse(data, notification)},
                error: function(jqXHR){ console.log("error"); handleError(data, notification)}
            });
        }
    }
);

var handleResponse = function(data, clippingNotification){
    clippingNotification.close();
    if (data.success){
        showNotification('Posted Clip to Findings', data.clip_content, 5000);
    } else {
        showNotification('Clip was not posted', getError(data.message), 5000);
    }
}

var handleError = function(jqXHR, clippingNotification){
    clippingNotification.close();
    notification = showNotification('Clip was not posted', 'There was an error tyring to reach the findings service. Please make sure you are logged in.', 5000);
}

function injectBookmarkletIntoPage(){
    var injectBookmarklet = "";
    injectBookmarklet += "var e=document.createElement('script');";
    injectBookmarklet += "e.setAttribute('id', 'fdgs_chrome_extension');";
    injectBookmarklet += "e.setAttribute('src', '" + config.findingsBaseURL + "/assets/js/bookmarklet.js');";
    injectBookmarklet += "document.body.appendChild(e);";

    chrome.tabs.executeScript(null, {
        code: injectBookmarklet
    });
}

// Add the bookmarklet to the current page. This is all we need to do to get
// the clipping functionality working.
chrome.browserAction.onClicked.addListener(function(tab) {
    injectBookmarkletIntoPage();
});

function onDomReady(){
    if(config.extensionFirstRun) {
        chrome.tabs.create({ url: chrome.extension.getURL('options.html') })
        config.extensionFirstRun = false;
    }
}

$(onDomReady)

function loadHighlightWhitelist(){
    $.ajax({
        url: 'https://findings.com/source/inline_highlights/whitelist/',
        success: function(data){
            whitelist = data;
        }
    });
}
loadHighlightWhitelist();
