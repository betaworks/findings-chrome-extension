var LSK_AMAZON_IMPORT_INTERVAL = 'amazonImportInterval';
var LSK_AMAZON_DESKTOP_NOTIFICATIONS_ENABLED = 'notificationsAmazonEnabledDesktop';

$(document).ready(function() {
    if (typeof(localStorage[LSK_AMAZON_IMPORT_INTERVAL]) === 'undefined'){
        localStorage[LSK_AMAZON_IMPORT_INTERVAL] = '24';
    }

    $("#amazon_import_interval").val(localStorage[LSK_AMAZON_IMPORT_INTERVAL]);

    if (typeof(localStorage[LSK_AMAZON_DESKTOP_NOTIFICATIONS_ENABLED]) === 'undefined'){
        localStorage[LSK_AMAZON_DESKTOP_NOTIFICATIONS_ENABLED] = 'true';
    }

    $("#amazon_desktop_notifications_enabled").prop(
        'checked',
        localStorage[LSK_AMAZON_DESKTOP_NOTIFICATIONS_ENABLED] === 'true' ? true : false
    );

    $("#amazon_import_interval").change(function() {
        localStorage[LSK_AMAZON_IMPORT_INTERVAL] = $(this).val();
    });

    $("#amazon_desktop_notifications_enabled").change(function() {
        localStorage[LSK_AMAZON_DESKTOP_NOTIFICATIONS_ENABLED] = $("#amazon_desktop_notifications_enabled").prop("checked");
    });


    // TODO: Handle the 'Import Now' button
});
