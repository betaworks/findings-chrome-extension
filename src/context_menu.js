// A generic onclick callback function.
function handleClick(info, tab) {
    var data = {
        "content": info.selectionText,
        "url": info.pageUrl,
        "title": tab.title,
        "clip-method": 'chrome-context-menu' 
    };
    var notification = showNotification('Posting Clip to Findings...');
    $.ajax({
        type: 'POST',
        dataType: 'json',
        url: config.findingsBaseURL + '/clips/enterclip/',
        data: data,
        success: function(data){ handleResponse(data, notification)},
        error: function(jqXHR){ handleError(data, notification)}
    });
}

var id = chrome.contextMenus.create({
    "title": "Clip to Findings",
    "contexts":['selection'],
    "onclick": handleClick,
    "documentUrlPatterns": ['http://*/*', 'https://*/*']
});
