var FDGS_BASE_DOMAIN = 'findings.com';
var FDGS_LOGGING_ENABLED = false;
var FDGS_DISABLE_CACHING = false;
var FDGS = {};
var date = new Date();


var app = {
	started: date.getTime(),
	badgeText: "",
	loader_script: "fdgs_loader.js",
	usedAsins: [],
	findingsUser: {},

	initButton: function () {
		var app = this;
		chrome.browserAction.onClicked.addListener(function(tab) {
			if(!localStorage['isDev']) { localStorage['isDev'] = false; }
			if(!localStorage['devDomain']) { localStorage['devDomain'] = "dev.findings.com"; }

			chrome.tabs.executeScript(null, {code: "FDGS_BASE_DOMAIN = '" + FDGS_BASE_DOMAIN + "'; FDGS_LOGGING_ENABLED = " + FDGS_LOGGING_ENABLED + "; FDGS_DISABLE_CACHING = " + FDGS_DISABLE_CACHING + ";"});
			chrome.tabs.executeScript(null, {file: app.loader_script});
		});
	},

	setEnvironment: function() {
		if(eval(localStorage['isDev'])) {
			console.log("Findings Chrome Extension is in DEV MODE.")
			app.badgeText = "DEV!";

			FDGS_BASE_DOMAIN =  localStorage['devDomain'];
			FDGS_LOGGING_ENABLED = true;
			FDGS_DISABLE_CACHING = true;

		} else {
			app.badgeText = "";
			FDGS_BASE_DOMAIN =  "findings.com";
			FDGS_LOGGING_ENABLED = false;
			FDGS_DISABLE_CACHING = false;
		}
	},

	setBadgeText: function(txt) {
		var app = this;
		if(eval(localStorage['isDev'])) {
			this.badgeText = "DEV!";
		} else {
			this.badgeText = "";
		}

		chrome.browserAction.setBadgeText({"text": app.badgeText});
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
        if(FDGS_LOGGING_ENABLED) {
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

$(document).ready(function() {
	FDGS = app.init();
	//console.log(FDGS);
	if(FDGS.findingsUser.isLoggedIn) {
		//this.startKindleImport();
		kindle_importer.start();
	} else {
		//prompt for login somehow
	}
});
