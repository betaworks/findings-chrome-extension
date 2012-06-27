var app = {
	badgeText: "",
	loader_script: "fdgs_loader.js",

	initButton: function () {
		var app = this;
		chrome.browserAction.onClicked.addListener(function(tab) {
			if(!localStorage['isDev']) { localStorage['isDev'] = false; }
			if(!localStorage['devDomain']) { localStorage['devDomain'] = "dev.findings.com"; }

			if(eval(localStorage['isDev'])) {
				console.log("Findings Chrome Extension is in DEV MODE.")
				app.badgeText = "DEV!";

				chrome.tabs.executeScript(null, {code: "FDGS_BASE_DOMAIN = '" + localStorage['devDomain'] + "'; FDGS_LOGGING_ENABLED = true; FDGS_DISABLE_CACHING = true;"});
			} else {
				app.badgeText = "";
				chrome.tabs.executeScript(null, {code: "FDGS_BASE_DOMAIN = 'findings.com'; FDGS_LOGGING_ENABLED = false; FDGS_DISABLE_CACHING = false;"});
			}

			chrome.tabs.executeScript(null, {file: app.loader_script});
		});
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

	kindleBackgroundImport: function() {
		console.log("Kindle import!");

		var newTabID = -1;

		var kindleWindowData = {
			url: "https://kindle.amazon.com/your_highlights",
			focused: false
		}

		var callback = function(window) {
			newTabID = window.id;
			console.log("new window: " + newTabID);
			//chrome.tabs.executeScript(tabId, { code: "alert('loaded!');" });
		};

		//chrome.windows.create(kindleWindowData, callback);

		$.get(kindleWindowData.url, "html", function(src) {
			console.log(src);
		});

		// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
		// 	console.log(tabId);
		// 	if(tabId == newTabID && changeInfo.status == "complete"){
		// 		chrome.tabs.executeScript(tabId, { code: "console.log(tabId + ' changed!');" });
		// 	}
		// });

		// chrome.tabs.getAllInWindow(null, function(tabs) {
		//   tabs.forEach(function(tab){
		//     console.log(tab);
		//   });
		// });
	},

	init: function() {
		this.initButton();
		this.kindleBackgroundImport();
		this.setBadgeText();
		return this;
	}
}

$(document).ready(function() {
	var fdgs = app.init();
});
