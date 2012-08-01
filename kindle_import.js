(function(w) {
    w.KindleImporter = {
        FDGS: {},
        upcoming_asins: [],
        used_asins: [],
        offset: null,
        sync_queue: 0,
        highlight_total: 0,
        post_url: "",
        completedImportInfo: [],

        next_book_url: "https://kindle.amazon.com/your_highlights/next_book",
        notification_templates: {
            "importSuccess": "notify_kindle_import_success.html",
            "importFailed": "notify_kindle_import_fail.html",
            "importEmpty": "notify_kindle_import_empty.html",
            "amazonNotLoggedIn": "notify_kindle_import_failed_amazon_login.html",
            "findingsNotLoggedIn": "notify_kindle_import_failed_findings_login.html"
        },

        get_next_book: function (){
            var _this = this;
            var get_params = {};

            _this.sync_queue += 1;
            if(_this.offset !== null) { //null for the first request --> don't need to send any params
                get_params.used_asins = _this.used_asins;
                get_params.upcoming_asins = _this.upcoming_asins;
                get_params.current_offset = _this.offset;
            }

            //_this.log(get_params);

            $.get(_this.next_book_url, get_params, function(src) {
                _this.processKindleData(src);
            }, "html");
        },

        processKindleData: function(src){
            var _this = this;

            if (src === ""){
                _this.FDGS.log('No more kindle data to sync');
                _this.sync_queue -= 1;
                if (_this.sync_queue <= 0){
                    _this.closeImport();
                }
                return;
            }

            var stage = $(src);
            var book = $(stage).filter('.bookMain')[0];

            var title = $(book).find('.title a')[0];
            title = $(title).text();

            var id = $(book).attr('id').split('_');
            var asin = id[0];
            _this.offset = id[1];
            _this.used_asins.push(asin);

            var upcoming = $(book).find('.upcoming')[0];
            _this.upcoming_asins = $(upcoming).text().split(',');

            var highlights = stage.filter('.yourHighlight');
            var clips = [];
            $.each(highlights, function(n){
                var location_href = $(highlights[n]).find('a.readMore').attr('href');
                var kindle_location = location_href.match(/location=(\d+)/)[1];
                clips.push({
                    'content': $(highlights[n]).find('.highlight').text(),
                    'comment': $(highlights[n]).find('.noteContent').text(),
                    'kindle_location': kindle_location
                });
            });

            var post_data = {
                'asin' : asin,
                'title' : title,
                'clips' : JSON.stringify(clips)
            }

            //_this.FDGS.log(post_data);

            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: _this.post_url,
                data: post_data,
                success: function(data) {
                    if (!data.success || _this.sync_queue <= 0){
                        _this.log("No new clips for ASIN " + post_data.asin + ". Closing import...");
                        _this.closeImport();
                    } else {
                        _this.saveProgress(data);
                        _this.get_next_book();
                    }
                }
            });
        },

        saveProgress: function(data){
            var _this = this;
            var book = {};
            var asin = data.result.asin;
            var coverImg = "http://images.amazon.com/images/P/" + asin + ".01.TZZ.jpg";

            book.asin = asin;
            book.coverImg = coverImg;
            book.total = data.result.new;
            _this.highlight_total += book.total; //used for desktop notification

            _this.completedImportInfo.unshift(book);
            _this.log(_this.completedImportInfo);
        },

        beginImport: function() {
            var _this = this;
            // reset these for results display
            _this.FDGS.amazonLastImportData = null;
            _this.FDGS.amazonLastImportTotal = null;

            //login statuses
            var desktopNotifyAllowed = _this.FDGS.settings.notificationsAmazonEnabledDesktop;
            var emailNotifyAllowed = _this.FDGS.settings.notificationsAmazonEnabledEmail;

            var isLoggedInAmazon = false;
            var isLoggedInFindings = false;


            //we're now processsing highlights

            //This should be rewritten to use jQuery promises!
            _this.FDGS.getAmazonLoginStatus(function(isLoggedInAmazon) {
                if(!isLoggedInAmazon) {

                    _this.FDGS.log("User is no longer logged into Amazon...aborting import.");
                    if(desktopNotifyAllowed) {
                        _this.FDGS.showNotification(notification_templates.amazonNotLoggedIn);
                    }
                    _this.closeImport(false); //cancel import
                    return false; //break out of this callback

                } else { // Amazon login OK, now check for Findings login

                    _this.FDGS.getFindingsLoginStatus(function(isLoggedInFindings) {

                        if(!isLoggedInFindings) {
                            _this.FDGS.log("User is no longer logged into Findings...aborting import.");
                            if(desktopNotifyAllowed) {
                                _this.FDGS.showNotification(notification_templates.findingsNotLoggedIn);
                            }
                            _this.closeImport(false); //
                        } else { // Findings login OK, too...initiate import!
                            _this.get_next_book();
                        }
                    });
                }
            });
        },

        closeImport: function(notify) {
            // close out import and reset object for the next import
            if(arguments.length == 0) {
                var notify = true; //default notifications to true
            }

            var _this = this;

            var desktopNotifyAllowed = _this.FDGS.settings.notificationsAmazonEnabledDesktop;
            var emailNotifyAllowed = _this.FDGS.settings.notificationsAmazonEnabledEmail;

            // first send import success notification (if new quotes were imported)
            _this.FDGS.settings.updateLastImportDate();
            if(notify && desktopNotifyAllowed && !_this.FDGS.nofication_is_displayed) {
                if(_this.completedImportInfo.length > 0) {
                    _this.FDGS.amazonLastImportData = _this.completedImportInfo;
                    _this.FDGS.amazonLastImportTotal = _this.highlightTotal;
                }

                if(_this.completedImportInfo.length == 0 && _this.FDGS.settings.isDev) {
                    _this.FDGS.showNotification(_this.notification_templates.importEmpty);
                } else if (_this.completedImportInfo.length > 0) {
                    _this.FDGS.showNotification(_this.notification_templates.importSuccess);
                }
                _this.FDGS.notification_is_displayed = true;
            }


            // now reset the object 
            _this.upcoming_asins = [];
            _this.used_asins = [];
            _this.offset = null;
            _this.sync_queue = 0;
            _this.highlight_total = 0;
            _this.completedImportInfo = [];

            chrome.browserAction.setIcon({"path": "icon-16x16.png"});

            // reset the last import data
            _this.FDGS.log("Import process closed.  Over and out. [" + _this.FDGS.settings.lastImportDate + "]");
        },

        log: function(thing) {
            this.FDGS.log(thing);
        },

        start: function() {
            //Ready Player 1...
            this.beginImport();        
        },

        init: function(FDGS) {
            this.FDGS = FDGS;
            console.log("intitializing Kindle importer...");
            this.post_url = "https://" + this.FDGS.useDomain + "/clips/enterbatch/";
            return this;
        }
    }
})(window);
