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
    },

    getFindingsLoginStatus: function() {
      $.getJSON("")
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
  };
})(window);

$(document).ready(function() {
  opt.restore();
  $("#optionsList li input").click(function() { opt.save(); })
});