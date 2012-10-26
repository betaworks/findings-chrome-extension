var error_mapping = {
    'clip too long': "The text you selected is too long. Clips must be 3000 characters or less.",
    'clip exists': "You've already clipped this text.",
    '__default__': "An unexpected error occured. Please try again."
}

function getError(key){
    if ( key !== '' )
    return error_mapping[key] || error_mapping['__default__'];
}

// Some helper functions
function showNotification(title, body, ttl) {
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
