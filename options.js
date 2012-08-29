$(document).ready(function() {
    $("#amazon_import_interval").val(config.amazonSyncInterval);

    $("#amazon_desktop_notifications_enabled").prop(
        'checked',
        config.desktopNotificationsEnabled
    );

    $("#amazon_import_interval").change(function() {
        config.amazonSyncInterval = $(this).val();
    });

    $("#amazon_desktop_notifications_enabled").change(function() {
        config.desktopNotificationsEnabled = $("#amazon_desktop_notifications_enabled").prop("checked");
    });

    $("#import_now").click(function() {
        config.lastAmazonSyncDate = null;
    });

    $("#quick_clip_key").change(function(e) {
        console.log(e);
        //config.quickClipKey = ;
    });
});
