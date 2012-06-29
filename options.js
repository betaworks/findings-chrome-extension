(function(w) {
  // Saves options to localStorage.
  w.opt = {
    getEl: function(id) { return document.getElementById(id) },

    save: function() {
      console.log("Saving options...");
      var checkit = this.getEl("isDev");
      var domain = this.getEl("devDomain");
      var kindleImport = this.getEl("doKindleImport");

      var badgeText = "";

      localStorage["isDev"] = checkit.checked;
      localStorage["devDomain"] = domain.value;
      localStorage["doKindleImport"] = kindleImport.checked;

      if(eval(localStorage['isDev'])) {
        badgeText = "DEV!";
      } else {
        badgeText = "";
      }

      chrome.browserAction.setBadgeText({"text": badgeText});

      this.setEnvironment();
      this.setBadgeText();
    },

    // Restores select box state to saved value from localStorage.
    restore: function() {
      console.log("Restoring options...");
      
      var checkit = this.getEl("isDev");
      var devDomain = this.getEl("devDomain");
      var kindleImport = this.getEl("doKindleImport");

      var isDev = eval(localStorage["isDev"]) || false;
      var domain = localStorage["devDomain"] || "dev.findings.com";
      var doKindleImport = eval(localStorage["doKindleImport"]) || false;

      devDomain.value = domain;
      checkit.checked = isDev;
      kindleImport.checked = doKindleImport;
    },

    update: function() {
      //run the functions necessary to set the environment, check login, etc.
      this.setEnvironment();
      this.setBadgeText();
      this.getFindingsLoginStatus();

    },

    //Since I can't access the FDGS object on the background JS page I have to dupe it. Boo!
    setEnvironment: function() {
      var _this = this;
      if(eval(localStorage['isDev'])) {
        console.log("Findings Chrome Extension is now in DEV MODE.")
        _this.badgeText = "DEV!";

        localStorage['FDGS_BASE_DOMAIN'] = localStorage['devDomain'];
        localStorage['FDGS_LOGGING_ENABLED'] = true;
        localStorage['FDGS_DISABLE_CACHING'] = true;

      } else {
        localStorage['FDGS_BASE_DOMAIN'] =  "findings.com";
        localStorage['FDGS_LOGGING_ENABLED'] = false;
        localStorage['FDGS_DISABLE_CACHING'] = false;
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

    getFindingsLoginStatus: function() {
      var userURL = "https:// + " localStorage['FDGS_BASE_DOMAIN'] + "/logged_in";
      $.getJSON(userURL, function(result) {
        //do something
      });
    },

  };
})(window);

$(document).ready(function() {
  opt.restore();
  $("#optionsList li input").click(function() { opt.save(); })
});