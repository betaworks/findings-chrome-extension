chrome.browserAction.onClicked.addListener(function(tab) {
	if(!localStorage['isDev']) { localStorage['isDev'] = false; }
	if(!localStorage['devDomain']) { localStorage['devDomain'] = "dev.findings.com"; }

	var script = "fdgs_sidebar.js";
	
	if(eval(localStorage['isDev'])) {
		// script = "fdgs_sidebar_dev.js"
		console.log("Findings Chrome Extension is in DEV MODE.")
		chrome.tabs.executeScript(null, {code: "FDGS_BASE_DOMAIN = '" + localStorage['devDomain'] + "'; FDGS_LOGGING_ENABLED = true; FDGS_DISABLE_CACHING = true;"});
	} else {
		chrome.tabs.executeScript(null, {code: "FDGS_BASE_DOMAIN = 'findings.com'; FDGS_LOGGING_ENABLED = false; FDGS_DISABLE_CACHING = false;"});
	}

	chrome.tabs.executeScript(null, {file: script});
});