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
		// base_domain: localStorage['FDGS_base_domain'] || "findings.com",
		// logging_enabled: localStorage['FDGS_logging_enabled'] || false,
		// disable_caching: localStorage['FDGS_disable_caching'] || false,

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
			this.kindle_importer = importer.start(FDGS);
		},

		getFindingsLoginStatus: function() {
			//check to see if the user is logged into Findings
			this.findingsUser = {
				"isLoggedIn": true,
				"username": "corey"
			}
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
			this.settings = extension_settings();
			this.settings.log();
			this.setEnvironment();
			this.setBadgeText();
			this.initButton();

			this.getFindingsLoginStatus();
			return this;
		}
	}

})(window);

$(document).ready(function() {
	window.FDGS = App.init();

	if(FDGS.findingsUser.isLoggedIn) {
		if(eval(localStorage['doKindleImport'])) {
			kindle_importer.start();
		} else {
			FDGS.log("Kindle import disabled by user.");
		}
	} else {
		//prompt for login somehow

	}
});

