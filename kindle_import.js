(function(w) {
    w.KindleImporter = {
        FDGS: {},
        import_start_time: 0,
        failed: [],
        upcoming_asins: [],
        used_asins: [],
        offset: null,
        sync_queue: 0,
        highlight_total: 0,
        post_url: "",
        completed_imports: [],
        notification_email_url: "",
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
            
            _this.log("Posting " + clips.length + " clips from \"" + post_data.title + "\" (" + post_data.asin + ")...");

            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: _this.post_url,
                data: post_data,
                timeout: 120000,
                success: function(data) {
                    if (!data.success || _this.sync_queue <= 0){
                        _this.log("No new clips for \"" + post_data.title + "\". (" + post_data.asin +") Closing import...");
                        _this.closeImport();
                    } else {
                        _this.saveProgress(data);
                        _this.get_next_book();
                    }
                },
                statusCode: {
                    404: function() {
                        var alertURL = "http://" + _this.FDGS.useDomain + "/service/alert/";
                        var msg = "Import timed out for \"" + post_data.title + "\" (" + post_data.asin + ").";
                        var data = {"message": msg};
                        $.getJSON(alertURL, data, function(success) {
                            _this.FDGS.log(msg);
                            _this.failed.push(post_data);
                        });

                        //skip it and move on...
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

            _this.completed_imports.unshift(book);
        },

        closeImport: function(notify) {
            // close out import and reset object for the next import
            if(arguments.length == 0) {
                var notify = true; //default notifications to true
            }

            var _this = this;

            var desktopNotifyAllowed = _this.FDGS.settings.notificationsAmazonEnabledDesktop;

            // first send import success notification (if new quotes were imported)
            _this.FDGS.settings.updateLastImportDate();
            if(notify && desktopNotifyAllowed) {
                if(_this.completed_imports.length > 0) {
                    _this.FDGS.amazonLastImportData = _this.completed_imports;
                    _this.FDGS.amazonLastImportTotal = _this.highlightTotal;
                }

                if(_this.completed_imports.length == 0 && _this.FDGS.settings.isDev) {
                    _this.FDGS.showNotification(_this.notification_templates.importEmpty);
                } else if (_this.completed_imports.length > 0) {
                    _this.FDGS.showNotification(_this.notification_templates.importSuccess);
                }
            } else {
                _this.FDGS.log("Desktop notification disabled...skipping.")
            }

            //Hit the email notification URL (will skip it server-side if user has it disabled)
            if(_this.completed_imports.length > 0) { //only send the email if highlights were found
                var data = {"since": _this.import_start_time}
                $.getJSON(_this.notification_email_url, data, function(result) {
                    if(result.success) {
                        _this.FDGS.log("Import notification email sent!");
                    } else {
                        _this.FDGS.log("Notification email send FAILED.");
                    }
                });
            }

            if(_this.failed.length > 0) {
                _this.FDGS.log(_this.failed.length + " ASINs failed to import.");
            }

            // now reset the object 
            _this.upcoming_asins = [];
            _this.used_asins = [];
            _this.offset = null;
            _this.sync_queue = 0;
            _this.highlight_total = 0;
            _this.completed_imports = [];
            _this.import_start_time = 0;
            _this.failed = [];


            chrome.browserAction.setIcon({"path": "icon-16x16.png"});

            // reset the last import data
            _this.FDGS.amazonCurrentlyImporting = false;
            _this.FDGS.log("***** Amazon import complete.  Over and out. [" + _this.FDGS.settings.lastImportDate + "] *****");
        },

        beginImport: function() {
            var _this = this;
            var date = new Date();

            // reset these for results display
            _this.FDGS.amazonLastImportData = null;
            _this.FDGS.amazonLastImportTotal = null;

            //login statuses
            var desktopNotifyAllowed = _this.FDGS.settings.notificationsAmazonEnabledDesktop;

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
                            _this.import_start_time = Math.round((new Date()).getTime() / 1000);
                            _this.FDGS.amazonCurrentlyImporting = true;
                            _this.get_next_book();
                            _this.FDGS.log("\n\n***** Amazon import initiated at " + _this.import_start_time + "! *****");
                        }
                    });
                }
            });
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
            this.post_url = "http://" + this.FDGS.useDomain + "/clips/enterbatch/";
            this.notification_email_url = "http://" + this.FDGS.useDomain + "/email/notify/lastimport/";
            return this;
        }
    }
})(window);
