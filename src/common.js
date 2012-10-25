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
