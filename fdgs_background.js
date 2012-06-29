var FDGS = {};

(function(w) {
	var date = new Date();

	w.App = {
		started: date.getTime(),
		badgeText: "",
		loader_script: "fdgs_loader.js",
		usedAsins: [],
		findingsUser: {},
		BASE_DOMAIN: localStorage['FDGS_BASE_DOMAIN'] || "findings.com",
		LOGGING_ENABLED: localStorage['FDGS_LOGGING_ENABLED'] || false,
		DISABLE_CACHING: localStorage['FDGS_DISABLE_CACHING'] || false,

		initButton: function () {
			var _this = this;
			chrome.browserAction.onClicked.addListener(function(tab) {
				if(!localStorage['isDev']) { localStorage['isDev'] = false; }
				if(!localStorage['devDomain']) { localStorage['devDomain'] = "dev.findings.com"; }

				chrome.tabs.executeScript(null, {code: "FDGS_BASE_DOMAIN = '" + _this.BASE_DOMAIN + "'; FDGS_LOGGING_ENABLED = " + _this.LOGGING_ENABLED + "; FDGS_DISABLE_CACHING = " + _this.DISABLE_CACHING + ";"});
				chrome.tabs.executeScript(null, {file: _this.loader_script});
			});
		},

		setEnvironment: function() {
			var _this = this;
			if(eval(localStorage['isDev'])) {
				console.log("Findings Chrome Extension is in DEV MODE.")
				_this.badgeText = "DEV!";

				_this.BASE_DOMAIN = localStorage['devDomain'];
				_this.LOGGING_ENABLED = true;
				_this.DISABLE_CACHING = true;

			} else {
				_this.badgeText = "";
				_this.BASE_DOMAIN =  "findings.com";
				_this.LOGGING_ENABLED = false;
				_this.DISABLE_CACHING = false;
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
	        if(localStorage['FDGS_LOGGING_ENABLED']) {
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
			this.setEnvironment();
			this.setBadgeText();
			this.initButton();

			this.getFindingsLoginStatus();
			return this;
		}
	}

})(window);

$(document).ready(function() {
	FDGS = App.init();

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

