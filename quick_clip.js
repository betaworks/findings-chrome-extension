// Listen for the quick clip keypress
document.addEventListener('keypress', function(e){
    if ( String.fromCharCode(e.charCode) === config.quickClipKey ){
        chrome.extension.sendMessage({
                content: window.getSelection().toString(),
                url: document.location.href,
                title: document.title
            }, function(response) {
            console.log(response.farewell);
            }
        );
    }
});
