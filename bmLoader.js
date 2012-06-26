(function(window, undefined) {
    var FDGS_BASE_DOMAIN = "dev.findings.com";
    var FDGS_BASE_URL = "http://" + FDGS_BASE_DOMAIN;
    var FDGS_LOGGING_ENABLED = true;
    var FDGS_DISABLE_CACHING = false;

    var date = new Date();

    window.FDGS = window.FDGS || { 
        Loader: {},
        WebClip: {},
        KindleSync: {},
        loaded: false,
        logging_enabled: FDGS_LOGGING_ENABLED,
        disable_caching: FDGS_DISABLE_CACHING,
        started: date.getTime(),
        baseDomain: FDGS_BASE_DOMAIN, //global post base URL
        baseURL: FDGS_BASE_URL,
        isLoggedIn: false,
        user: {
            username: "",
            social_services: {
                "twitter": 0,
                "tumblr": 0,
                "facebook": 0
            }
        },

        getLoginStatus: function(callback) {
            //checks whether user is logged in
            var username = null;
            if(arguments.length == 0 ) {
                callback = function(username) { FDGS.log("empty callback!"); };
            }

            //do ajax login check here

            return callback(username);
        },

        getSocialServices: function(username) {
            //gets connected social services for the user

        },

        //safe console logging
        log: function(msg, use_ts) {
            if(this.logging_enabled) {
                if(typeof(use_ts) == "undefined") use_ts = true;
                if(use_ts) {
                    var date = new Date();
                    ts = (date.getTime() - this.started) / 1000;
                    logtxt = "[" + ts + "] " + msg;
                } else {
                    logtxt = msg;
                }
                
                if(window.hasOwnProperty("console")) console.log(logtxt);
            }
        }
    };

    var FDGS = window.FDGS;

    if(FDGS.loaded === true) {
        FDGS.log("FDGS already loaded!");
        if(FDGS.Loader.bm_type === "webclip" && FDGS.WebClip.hasOwnProperty("open")) {
            FDGS.WebClip.open();
        } else {
            //nothing for now... (Kindle import has already kicked off)            
        }

    } else {

        FDGS.log("NOT LOADED!");
        FDGS.log("Caching disabled: " + FDGS.disable_caching);

        (function() {
            var FDGS = window.FDGS;

            FDGS.getLoginStatus();

                
            FDGS.Loader = function() {
                var me = {};

                FDGS.log("creating FDGS.Loader");

                me.yn_loaded = {}; //window interval to check for Yepnope load status
                me.yepnope_ready = false;
                me.bm_type = "";
                me.yn_is_loading = false;

                document.location.href.indexOf("kindle.amazon.com") < 0 ? me.bm_type = "webclip" : me.bm_type = "kindle";
            
                me.getUniqueQS = function() {
                    var cache_it = "";
                    var d, r;
                    if(FDGS.disable_caching) {
                        d = new Date();
                        r = d.getTime();
                    } else {
                        //CURRENT VERSION
                        r = "20110611";
                    }
                    cache_it = "?r=" + r;
                    return cache_it;
                }
                
                me.loadYepNope = function() {
                    var YN1=document.createElement('script');
                    YN1.setAttribute('type','text/javascript');
                    YN1.setAttribute('src',"//" + FDGS.baseDomain + "/static/js/libs/yepnope.1.0.1-min.js?r=" + me.getUniqueQS())
                    document.body.appendChild(YN1);
                }
                
                me.loadYNCSSHandler = function() {
                    /*
                    
                    XXX TODO:
                        1.  Use YepNope to load CSS, not FDGS.Loader
                    
                    Keeping this in for now, but when YN is used to load CSS the process takes >10sec.  Using a custom CSS loader
                    in FDGS.Loader for now, but should look into make it work with YepNope.
                    */
                    
                    FDGS.log("waiting for YN...");
                    if(!me.yn_is_loading) me.yn_is_loading = true;

                    if(window.hasOwnProperty("yepnope")) me.yepnope_ready = true;
                
                    if(me.yepnope_ready) {
                        FDGS.log("YN loaded...continuing...")
                        clearInterval(me.yn_loaded);
                        var YN2 = document.createElement('script');
                        YN2.setAttribute('type','text/javascript');
                        YN2.setAttribute('src',"//" + FDGS.baseDomain + "/static/js/libs/prefixes/yepnope.css-prefix.js" + me.getUniqueQS())
                        me.loadScripts();
                    }
                }
            
                me.loadCSS = function(url) {
                    /* if(typeof(yepnope) === "undefined") { */
                        var e = document.createElement("link");
                        e.setAttribute("type", "text/css");
                        e.setAttribute("href", url);
                        e.setAttribute("rel", "stylesheet");
                        e.setAttribute("media", "screen");
                        try {
                            document.getElementsByTagName("head")[0].appendChild(e);
                        } catch(z) {
                            document.body.appendChild(e);
                        }
                }
            
                me.loadScripts = function () {
                    if(me.yepnope_ready) {
                        yepnope([
                            {
                                load: "//ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js",
                                complete: function () {
                                    if (!window.jQuery) {
                                        yepnope({
                                            load: '//' + FDGS.baseDomain + '/static/js/libs/jquery-1.5.1.min.js'+ me.getUniqueQS(),
                                            complete: function() { $fjq = jQuery.noConflict(); }
                                        });
                                    }
                                    $fjq = jQuery.noConflict();

                                    yepnope([
                                        {
                                            load: '//' + FDGS.baseDomain + '/static/js/global.js' + me.getUniqueQS()
                                        },
                                        
                                        {
                                            load: '//' + FDGS.baseDomain + '/static/js/json2.js' + me.getUniqueQS(),
                                            callback: me.bmSwitcher
                                        }
                                    ]);
                                }
                            }
                        ]);
                        me.loading = false; //set loading back to false.
                    }
                }
            
                me.bmSwitcher = function() {
                    switch(me.bm_type) {
                        case "kindle":
                            me.doKindle();
                            break;
                            
                        case "webclip":
                            me.doWebclip();
                            break;
                    }
                }
            
                me.doKindle = function() {
                    if(typeof(KindleCapture) == "undefined") {
                        me.loadCSS("//" + FDGS.baseDomain + "/static/css/compiled/kindle_import.css" + me.getUniqueQS());
                        yepnope("//" + FDGS.baseDomain + "/static/js/crypt.js" + me.getUniqueQS());
                        yepnope("//" + FDGS.baseDomain + "/static/js/kindle_overlay.js" + me.getUniqueQS());
                    }
                }
            
                me.doWebclip = function() {
                    var current_version = "20120611";

                    if(typeof(WebClip) == "undefined") {
                        me.loadCSS("//" + FDGS.baseDomain + "/static/css/jquery.jscrollpane.css" + me.getUniqueQS());
                        me.loadCSS("//" + FDGS.baseDomain + "/static/css/jquery.jscrollpane.fdgs_lozenge.css" + me.getUniqueQS())

                        yepnope([
                            {
                                load: "//" + FDGS.baseDomain + "/static/js/libs/webclip_plugins.js" + me.getUniqueQS()
                            },

                            {
                                load: "//" + FDGS.baseDomain + "/static/js/webclip_overlay.js" + me.getUniqueQS()
                            },
                        ]);
            
                        //NEED THIS B/C YEPNOPE CSS LOADING SEEMS TO BE BROKEN...take 10 sec to load DIV and seems to do an additional call to bm_loader_yepnope
                        me.loadCSS("//" + FDGS.baseDomain + "/static/css/compiled/webclip.css" + me.getUniqueQS());
                    }
                }

                me.start = function() {
                    FDGS.log("starting loader...");
                    me.loadYepNope();
                    me.yn_loaded = setInterval(me.loadYNCSSHandler, 250);
                }
                
                //Kickoff Yepnope Loader
                me.start();

                return me;
            }();
        })();
    }


    //FDGS load complete.  Set loaded so we don't do all this again.
    FDGS.loaded = true;
})(window)
