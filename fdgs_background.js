var FDGS = {};

(function(w) {
	var date = new Date();

	w.App = {
		started: date.getTime(),
		badgeText: "",
		loader_script: "fdgs_loader.js",
		usedAsins: [],
		findingsUser: {},
		settings: w.extension_settings,
		amazonPinger: null,
		amazonImportTimer: null,
		amazonLastImportData: null,
		useDomain: "findings.com",

		initButton: function () {
			var _this = this;
			chrome.browserAction.onClicked.addListener(function(tab) {
				var setConstants = "(setConstants = function() {FDGS_BASE_DOMAIN = '" + _this.settings.base_domain + "'; FDGS_LOGGING_ENABLED = " + _this.settings.logging_enabled + "; FDGS_DISABLE_CACHING = " + _this.settings.disable_caching + ";})()";

				_this.log(setConstants);

				chrome.tabs.executeScript(null, {code: setConstants});
				chrome.tabs.executeScript(null, {file: _this.loader_script});
			});
		},

		setEnvironment: function() {
			var _this = this;

			if(_this.settings.isDev) {
				_this.log("Findings Chrome Extension is now in DEV MODE.")
				_this.settings.badgeText = "DEV!";

				_this.settings.base_domain = _this.settings.devDomain;
			} else {
				_this.settings.badgeText = "";
			}
			_this.setBadgeText(_this.settings.badgeText);

			//useDomain is a global value for dynamically choosing which domain to use (dev or production)
			_this.useDomain = _this.settings.base_domain;
			if(_this.settings.isDev) {
				_this.settings.base_domain = _this.settings.devDomain;
			}
		},

		setBadgeText: function(txt) {
			var _this = this;
			chrome.browserAction.setBadgeText({"text": txt});
		},

		startKindleImport: function(FDGS) {
			var _this = this;
			var findingsUser = {};
			var desktopNotifyAllowed = _this.settings.notificationsAmazonEnabledDesktop;

			if(_this.settings.doKindleImport) {

				_this.getAmazonLoginStatus(function(isLoggedInAmazon) {
					if(!isLoggedInAmazon) {

						_this.log("User is not logged into Amazon...aborting import.");
						if(desktopNotifyAllowed) {
							_this.showNotification("notify_kindle_import_failed_amazon_login.html");
						}
						return false; //break out of this callback

					} else { // Amazon login OK, now check for Findings login

						_this.getFindingsLoginStatus(function(findingsUser) {
							if(!findingsUser.isLoggedIn) {
								_this.log("User is not logged into Findings...aborting import.");
								if(desktopNotifyAllowed) {
									_this.showNotification("notify_kindle_import_failed_findings_login.html");
								}
							} else { // Findings login OK, too...initiate import!
								_this.log("All systems go for Kindle import...")
								kindle_importer.start(FDGS);
								if(_this.amazonPinger == null) {
									_this.createAmazonPinger(); //ping Amazon every 5 min to stay logged in
								}
							}
						});
					}
				});


			} else {

				_this.log("User has disabled Kindle highlight importing.");
				_this.killAmazonPinger(); //stop pinging if they've turned off import

			}
		},

		getFindingsLoginStatus: function(callback) {
			//check to see if the user is logged into Findings
			var _this = this;

			if(arguments.length == 0) {
				var callback = function() { _this.log("No callback for Findings login status. Nothing to do."); };
			}

			var userURL = "https://" + _this.useDomain + "/logged_in";
			var returnUser ={"isLoggedIn": false, "username": ""};

			$.getJSON(userURL, function(user) {
		        if(user.isLoggedIn) {
		            _this.log("User is logged into " + _this.useDomain + " as user " + user.username);
		        } else {
		            _this.log("User is logged out of " + _this.useDomain + "!");
		        }
		        user.link = "<a href='https://" + _this.useDomain + "/" + user.username + "' target='blank'>" + user.username + "</a>";
				_this.findingsUser = user;
		        callback(user);
			});
		},

	    getAmazonLoginStatus: function(callback) {
	      //check to see if the user is logged into Amazon
	      var _this = this;
	      var highlightsURL = "https://kindle.amazon.com/your_highlights";

	      if(arguments.length == 0) {
	        var callback = function() { log("No callback for login status. Nothing to do. (" + _this.amazonLoggedIn + ")");}
	      }

	      $.get(highlightsURL, function(src) {
	        var source = $(src);
	        if($(source).find("#ap_signin_form").length > 0) {
	          _this.log("User is logged out of Amazon!");
	          _this.amazonLoggedIn = false;
	        } else {
	          _this.log("User is logged into Amazon!");
	          _this.amazonLoggedIn = true;
	        }

	        callback(_this.amazonLoggedIn);
	      }, "html");
	    },

	    createAmazonPinger: function() {
	    	//an attempt to keep the user logged into kindle.amazon.com
	    	var _this = this;
	    	var pingInterval = 5*60*1000; //five minutes
	    	var pingURL = "https://kindle.amazon.com/your_highlights";

	    	_this.amazonPinger = window.setInterval(function() { $.get(pingURL, function() { _this.log("pinged " + pingURL + "..."); }); }, pingInterval);
	    },

	    killAmazonPinger: function() {
	    	var _this = this;
	    	window.clearInterval(_this.amazonPinger);
	    	_this.amazonPinger = null;
	    	_this.log("Amazon pinger destroyed.");
	    },

	    createAmazonImportInterval: function() {
	    	var _this = this;
	    	var importInterval = _this.settings.amazonImportInterval*60*60*1000; //in hours

	    	_this.log("Creating Amazon import interval for " + _this.settings.amazonImportInterval + " hours.");

	    	_this.amazonImportTimer = window.setInterval(function() {
	    		_this.log("Kindle import interval elapsed! (" + _this.settings.amazonImportInterval + " hours) Kicking off Kindle import...")
	    		_this.startKindleImport();
	    	}, importInterval);
	    },

	    killAmazonImportInterval: function() {
	    	var _this = this;
	    	window.clearInterval(_this.amazonImportTimer);
	    	_this.amazonImportTimer = null;
	    	_this.log("Amazon import interval destroyed.")
	    },

	    defaultNotification: {
			notification_timeout: 10000,
			closer: {},
			bkg: {},

			getBackgroundPage: function() {
			  this.bkg = chrome.extension.getBackgroundPage();
			},

			createNotificationCloser: function(win) {
				//needs the window context for some reason (must be passed into start() within template )
				var _this = this;
				_this.closer = win.setTimeout(function() { win.close(); }, _this.notification_timeout);
			},

			start: function(win, callback) {
				if(arguments.length <= 1) {
					var callback = function() {};
				}

				if(arguments.length == 0) {
					var win = window;
				}

				var _this = this;

				_this.bkg = _this.getBackgroundPage();
				_this.createNotificationCloser(win);
				callback();
			}
		},

	    showNotification: function(template) {
			var notification = webkitNotifications.createHTMLNotification(template);
			notification.show();
	    },

        openPage: function (pg) {
        	var _this = this;
        	//we don't have a "/chrome" dir setting
        	//var localPage = _this.chrome_dir + pg;
            chrome.tabs.create({
                url: chrome.extension.getURL(pg)
            })
        },

		log: function(msg, use_ts) {
	        if(this.settings.logging_enabled) {
	            if(arguments.length < 2) use_ts = false;
	            if(use_ts) {
	                var date = new Date();
	                ts = (date.getTime() - this.started) / 1000;
	                logtxt = "[" + ts + "] " + msg;
	            } else {
	                logtxt = msg;
	            }
	            
	            if(window.hasOwnProperty("console")) console.log(logtxt);
	        }
	    },

		init: function() {
			var _this = this;

			_this.settings = extension_settings();
			_this.settings.log();

			_this.setEnvironment();
			_this.initButton();
			_this.startKindleImport();
			if(_this.settings.doKindleImport && _this.settings.amazonImportInterval > 0) {
				_this.killAmazonImportInterval();
				_this.createAmazonImportInterval();
			}
			return this;
		}
	}

})(window);

$(document).ready(function() {
	window.FDGS = App.init();
});

