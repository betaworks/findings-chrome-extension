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

		initButton: function () {
			var _this = this;
			chrome.browserAction.onClicked.addListener(function(tab) {
				//if(!localStorage['isDev']) { localStorage['isDev'] = false; }
				//if(!localStorage['devDomain']) { localStorage['devDomain'] = "dev.findings.com"; }

				chrome.tabs.executeScript(null, {code: "FDGS_BASE_DOMAIN = '" + _this.settings.base_domain + "'; FDGS_LOGGING_ENABLED = " + _this.settings.logging_enabled + "; FDGS_DISABLE_CACHING = " + _this.settings.disable_caching + ";"});
				chrome.tabs.executeScript(null, {file: _this.loader_script});
			});
		},

		setEnvironment: function() {
			var _this = this;

			if(_this.settings.isDev) {
				console.log("Findings Chrome Extension is now in DEV MODE.")
				_this.badgeText = "DEV!";

				_this.settings.base_domain = _this.settings.devDomain;
				// _this.base_domain = localStorage['devDomain'];
				// _this.logging_enabled = true;
				// _this.disable_caching = true;

			} else {
				_this.badgeText = "";
				// _this.base_domain =  "findings.com";
				// _this.logging_enabled = false;
				// _this.disable_caching = false;
			}
		},

		setBadgeText: function(txt) {
			var _this = this;
			if(eval(localStorage['isDev'])) {
				this.badgeText = "DEV!";
			} else {
				this.badgeText = "";
			}

			chrome.browserAction.setBadgeText({"text": _this.badgeText});
		},

		startKindleImport: function(FDGS) {
			var _this = this;
			var findingsUser = {};
			var amazonIsLoggedIn = false;

			_this.getFindingsLoginStatus(function(user) {
				findingsUser = user;

				_this.getAmazonLoginStatus(function(isLoggedIn) {
					amazonIsLoggedIn = isLoggedIn;

				if(findingsUser.isLoggedIn && amazonIsLoggedIn && _this.settings.doKindleImport) {
					_this.log("All systems go for Kindle import...")
					kindle_importer.start(FDGS);
				} else {
					_this.log("Kindle import disabled. Settings: [Findings Logged In: " + findingsUser.isLoggedIn + " Amazon Logged In: " + amazonIsLoggedIn + " Import Enabled: " + _this.settings.doKindleImport + "]");
				}
				});
			});
		},

		getFindingsLoginStatus: function(callback) {
			//check to see if the user is logged into Findings
			var _this = this;

			if(arguments.length == 0) {
				var callback = function() { FDGS.log("No callback for Findings login status. Nothing to do."); };
			}

			var userURL = "https://" + this.settings.base_domain + "/logged_in";
			var returnUser ={"isLoggedIn": false, "username": ""};

			$.getJSON(userURL, function(user) {
		        if(user.isLoggedIn) {
		            _this.log("User is logged into Findings as user " + user.username);
		        } else {
		            _this.log("User is logged out of Findings!");
		        }
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
	          FDGS.log("User is logged out of Amazon!");
	          _this.amazonLoggedIn = false;
	        } else {
	          FDGS.log("User is logged into Amazon!");
	          _this.amazonLoggedIn = true;
	        }

	        callback(_this.amazonLoggedIn);
	      }, "html");
	    },

		log: function(msg, use_ts) {
	        // if(localStorage['FDGS_logging_enabled']) {
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
			_this.setBadgeText();
			_this.initButton();
			_this.startKindleImport();
			return this;
		}
	}

})(window);

$(document).ready(function() {
	window.FDGS = App.init();

	// if(FDGS.findingsUser.isLoggedIn) {
	// 	if(eval(localStorage['doKindleImport'])) {
	// 		kindle_importer.start();
	// 	} else {
	// 		FDGS.log("Kindle import disabled by user.");
	// 	}
	// } else {
	//}
});

