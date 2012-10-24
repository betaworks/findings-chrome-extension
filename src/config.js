var LSK_QUICK_CLIP_KEY = 'quick_clip_key';
var LSK_FIRST_RUN = 'first_run';
var LSK_AMAZON_IMPORT_INTERVAL = 'amazonImportInterval';
var LSK_AMAZON_LAST_IMPORT = 'amazonLastImport';
var LSK_AMAZON_DESKTOP_NOTIFICATIONS_ENABLED = 'notificationsAmazonEnabledDesktop';

var config = {

    // Base URL for findings
    get findingsBaseURL(){
        return 'https://findings.com';
    },

    // Quick Clip
    get quickClipKey(){
        if (typeof(localStorage[LSK_QUICK_CLIP_KEY]) === 'undefined'){
            localStorage[LSK_QUICK_CLIP_KEY] = 'C';
        }

        return localStorage[LSK_QUICK_CLIP_KEY];
    },

    set quickClipKey(key){
        localStorage[LSK_QUICK_CLIP_KEY] = key;
    },

    // First run
    get extensionFirstRun(){
        if (typeof(localStorage[LSK_FIRST_RUN]) === 'undefined'){
            localStorage[LSK_FIRST_RUN] = 'true';
        }

        return localStorage[LSK_FIRST_RUN] === 'true' ? true : false;
    },

    set extensionFirstRun(value){
        localStorage[LSK_FIRST_RUN] = value;
    },

    // Desktop notifications
    get desktopNotificationsEnabled(){
        if (typeof(localStorage[LSK_AMAZON_DESKTOP_NOTIFICATIONS_ENABLED]) === 'undefined'){
            localStorage[LSK_AMAZON_DESKTOP_NOTIFICATIONS_ENABLED] = 'true';
        }

        return localStorage[LSK_AMAZON_DESKTOP_NOTIFICATIONS_ENABLED] === 'true' ? true : false;
    },

    set desktopNotificationsEnabled(value){
        localStorage[LSK_AMAZON_DESKTOP_NOTIFICATIONS_ENABLED] = value;
    },

    // Amazon Sync Interval
    get amazonSyncInterval(){
        if (typeof(localStorage[LSK_AMAZON_IMPORT_INTERVAL]) === 'undefined'){
            localStorage[LSK_AMAZON_IMPORT_INTERVAL] = '-1';
        }

        var interval = parseInt(localStorage[LSK_AMAZON_IMPORT_INTERVAL]);

        // Adjust the interval - Corey was using hours in the options, we've moved to using
        // milliseconds, so this will verify that we don't run amok when this version of the
        // extension is loaded.
        if (interval > 0 && interval < 1000){
            localStorage[LSK_AMAZON_IMPORT_INTERVAL] = '43200000';
        }

        return isNaN(interval) ? '86400000' : interval;
    },

    set amazonSyncInterval(value){
        localStorage[LSK_AMAZON_IMPORT_INTERVAL] = value;
    },

    // Last Amazon Sync Date
    get lastAmazonSyncDate(){
        if (typeof(localStorage[LSK_AMAZON_LAST_IMPORT]) === 'undefined'){
            localStorage[LSK_AMAZON_LAST_IMPORT] = '0';
        }

        var d = new Date();
        d.setTime(localStorage[LSK_AMAZON_LAST_IMPORT]);

        return d
    },

    set lastAmazonSyncDate(date){
        // Shortcut for clearing out the date so we can force a sync
        if (date == null){
            localStorage[LSK_AMAZON_LAST_IMPORT] = 0;
        } else {
            localStorage[LSK_AMAZON_LAST_IMPORT] = date.getTime();
        }
    },

}
