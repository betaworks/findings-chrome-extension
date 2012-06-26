chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.executeScript(null, {file: "fdgs_sidebar.js"});
});