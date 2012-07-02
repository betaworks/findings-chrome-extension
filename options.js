(function(w) {
  // Saves options to localStorage.
  w.opt = {
    findingsLoggedIn: false,
    amazonLoggedIn: false,

    getEl: function(id) { return document.getElementById(id) },

    save: function() {
      var _this = this;

      _this.log("Saving options...");
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
      var _this = this;

      _this.log("Restoring options...");
      
      var checkit = this.getEl("isDev");
      var devDomain = this.getEl("devDomain");
      var kindleImport = this.getEl("doKindleImport");

      var isDev = eval(localStorage["isDev"]) || false;
      var domain = localStorage["devDomain"] || "dev.findings.com";
      var doKindleImport = eval(localStorage["doKindleImport"]) || false;

      devDomain.value = domain;
      checkit.checked = isDev;
      kindleImport.checked = doKindleImport;

      //get Findings login status
      _this.getFindingsLoginStatus();

      if(doKindleImport) {
        _this.getAmazonLoginStatus(function() {
          _this.amazonImportOptionDisplay();
        });
      } else {
        //don't show the checking Amazon status
        $("#amazon_checking_login").hide();
      }
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
        _this.log("Findings Chrome Extension is now in DEV MODE.")
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
      var _this = this;
      var userURL = "https://" + localStorage['FDGS_BASE_DOMAIN'] + "/logged_in";
      $.getJSON(userURL, function(result) {
        //_this.log(result);
        if(result.isLoggedIn) {
            _this.findingsLoggedIn = true;
            _this.log("User is logged into Findings!");

            var userlink = "<a href='https://" + localStorage['FDGS_BASE_DOMAIN'] + "/" + result.username + "' target='blank'>" + result.username + "</a>";
            $("#fdgs_username_display").html(userlink);
            $("#fdgs_login_status .fdgs_logged_in").removeClass("hidden").addClass("visible");
            $("#fdgs_login_status .fdgs_logged_out").removeClass("visible").addClass("hidden");
        } else {
            _this.findingsLoggedIn = false;
            _this.log("User is logged out of Findings!");
            $("#fdgs_login_status .fdgs_logged_out").removeClass("hidden").addClass("visible");
            $("#fdgs_login_status .fdgs_logged_in").removeClass("visible").addClass("hidden");

        }
      });
    },

    findingsLogin: function() {
      var _this = this;

      _this.log("Logging into Findings...");
      var _this = this;
      var loginURL = "https://" + localStorage['FDGS_BASE_DOMAIN'] + "/authenticate";
      var username = $("#fdgs_username").val();
      var password = $("#fdgs_password").val();
      var data = {"username": username, "password": password};

      $.getJSON(loginURL, data, function() { _this.getFindingsLoginStatus(); });
    },

    findingsLogout: function() {
      var _this = this;
      _this.log("Logging out of Findings...");
      var _this = this;
      var logoutURL = "https://" + localStorage['FDGS_BASE_DOMAIN'] + "/logout";
      $.get(logoutURL, function() {
        _this.getFindingsLoginStatus();
      });

    },

    getAmazonLoginStatus: function(callback) {
      //check to see if the user is logged into Amazon
      var _this = this;
      var highlightsURL = "https://kindle.amazon.com/your_highlights";

      if(arguments.length == 0) {
        var callback = function() { _this.log("No callback for login status. Nothing to do. (" + _this.amazonLoggedIn + ")");}
      }

      $("#amazon_logged_in").hide();
      $("#amazon_checking_login").show();

      $.get(highlightsURL, function(src) {
        $("#amazon_checking_login").hide();
        var source = $(src);
        if($(source).find("#ap_signin_form").length > 0) {
          _this.log("User is logged out of Amazon!");
          _this.amazonLoggedIn = false;
        } else {
          _this.log("User is logged into Amazon!");
          _this.amazonLoggedIn = true;
;
        }

        callback();
      }, "html");
    },

    amazonImportOptionDisplay: function() {
      var _this = this;
      _this.log("showing import options...");

      if(eval(localStorage['doKindleImport'])) {

        //kindle import is checked
        if(_this.amazonLoggedIn) {
          $("#amazon_logged_out").hide();
          $("#amazon_logged_in").show();

          //show the import interval options
          $("#amazon_import_interval_disabled").hide();
          $("#amazon_import_interval_enabled").show();

        } else {
          $("#amazon_logged_in").hide();
          $("#amazon_logged_out").show();

          //show the login warning
          $("#amazon_logged_out").hide();
          $("#amazon_logged_in").show();
        }

      } else {

        //kindle import is not checked
        if(_this.amazonLoggedIn) {
          $("#amazon_logged_out").hide();
          $("#amazon_logged_in").show();

          //show the disabled import interval options
          $("#amazon_import_interval_enabled").hide();
          $("#amazon_import_interval_disabled").show();
        } else {
          $("#amazon_logged_in").hide();
          $("#amazon_logged_out").show();

          //do not show any import interval options
          $("#amazon_import_interval_enabled").hide();
          $("#amazon_import_Interval_disabled").hide();
        }

      }
    },

    start: function() {
      var _this = this;
      this.restore();

      $(".optionsList li input").click(function() { _this.save(); })

      $("#fdgs_login").click(function() { _this.findingsLogin(); })

      $("#fdgs_logout").click(function() { _this.findingsLogout(); });

      $("#doKindleImport").click(function(){
        if($(this).attr("checked")) {
          _this.getAmazonLoginStatus(function() {
            _this.amazonImportOptionDisplay();
          });
        } else {
          _this.amazonImportOptionDisplay();
        }
      });

      $("#amazon_import_interval").change(function() { _this.save(); });

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
    }
  };
})(window);

$(document).ready(function() {
  opt.start();
});