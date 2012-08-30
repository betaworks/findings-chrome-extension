// Listen for the quick clip keypress
document.addEventListener('keypress', function(e){
    // Handle configurable key later - it will require message passing
    //var key = config.quickClipKey;
    var key = 'C';
    if ( String.fromCharCode(e.charCode) === key ){
        chrome.extension.sendMessage({
                content: window.getSelection().toString(),
                url: document.location.href,
                title: document.title
            }, function(response) {}
        );
    }
});
