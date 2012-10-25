$(document).ready(function() {
    $("#amazon_import_interval").val(config.amazonSyncInterval);

    $("#amazon_desktop_notifications_enabled").prop('checked', config.desktopNotificationsEnabled);

    $("#amazon_import_interval").change(function() {
        config.amazonSyncInterval = $(this).val();
    });

    $("#amazon_desktop_notifications_enabled").change(function() {
        config.desktopNotificationsEnabled = $("#amazon_desktop_notifications_enabled").prop("checked");
    });

    $("#import_now").click(function() {
        KindleSync.sync();
    });

    /* -- Handle this later - it will require message passing
    $("#quick_clip_key").keypress(function(e) {
        if (! (e.altKey || e.ctrlKey || e.metaKey)){
            var key = String.fromCharCode(e.charCode);
            $(this).val(key)
            config.quickClipKey = key;
        }
    });

    $("#quick_clip_key").focus(function(e) {
        $(this).toggleClass('active', true);
    });

    $("#quick_clip_key").blur(function(e) {
        $(this).toggleClass('active', false);
    });

    $("#quick_clip_key").val(config.quickClipKey);
    */

    $("#quick_clip_key").val('C');
});
