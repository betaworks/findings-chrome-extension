(function(w) {
  // Saves options to localStorage.
  w.opt = {
    findingsLoggedIn: false,
    amazonLoggedIn: false,
    bkg: {},

    save: function() {
      var _this = this;

      log("Saving options...");

      var badgeText = "";

      _this.settings.isDev = toBool($("#isDev").prop("checked"));
      _this.settings.devDomain = $("#devDomain").val();
      _this.settings.doKindleImport = toBool($("#doKindleImport").prop("checked"));

      log(_this.settings.isDev);
      log(toBool($("#isDev").prop("checked")));

      if(_this.settings.isDev) {
        badgeText = "DEV!";
      } else {
        badgeText = "";
      }

      chrome.browserAction.setBadgeText({"text": badgeText});

      this.setBadgeText();
    },

    // Restores select box state to saved value from localStorage.
    restore: function() {
      var _this = this;

      log("Restoring options...");

      $("#isDev").prop("checked", this.settings.isDev);
      $("#devDomain").val(this.settings.devDomain);
      $("#doKindleImport").prop("checked", this.settings.doKindleImport);

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
      this.setBadgeText();
      this.getFindingsLoginStatus();
    },

    setBadgeText: function(txt) {
      var _this = this;
      if(this.settings.isDev) {
        this.badgeText = "DEV!";
      } else {
        this.badgeText = "";
      }

      chrome.browserAction.setBadgeText({"text": _this.badgeText});
    },

    getFindingsLoginStatus: function() {
      var _this = this;
      var userURL = "https://" + this.settings.base_domain + "/logged_in";
      $.getJSON(userURL, function(result) {
        //log(result);
        if(result.isLoggedIn) {
            _this.findingsLoggedIn = true;
            log("User is logged into Findings!");

            var userlink = "<a href='https://" + _this.settings.base_domain + "/" + result.username + "' target='blank'>" + result.username + "</a>";
            $("#fdgs_username_display").html(userlink);
            $("#fdgs_login_status .fdgs_logged_in").removeClass("hidden").addClass("visible");
            $("#fdgs_login_status .fdgs_logged_out").removeClass("visible").addClass("hidden");
        } else {
            _this.findingsLoggedIn = false;
            log("User is logged out of Findings!");
            $("#fdgs_login_status .fdgs_logged_out").removeClass("hidden").addClass("visible");
            $("#fdgs_login_status .fdgs_logged_in").removeClass("visible").addClass("hidden");

        }
      });
    },

    findingsLogin: function() {
      var _this = this;

      log("Logging into Findings...");
      var _this = this;
      var loginURL = "https://" + this.settings.base_domain + "/authenticate";
      var username = $("#fdgs_username").val();
      var password = $("#fdgs_password").val();
      var data = {"username": username, "password": password};

      $.getJSON(loginURL, data, function() { _this.getFindingsLoginStatus(); });
    },

    findingsLogout: function() {
      var _this = this;
      log("Logging out of Findings...");
      var _this = this;
      var logoutURL = "https://" + this.settings.base_domain + "/logout";
      $.get(logoutURL, function() {
        _this.getFindingsLoginStatus();
      });

    },

    getAmazonLoginStatus: function(callback) {
      //check to see if the user is logged into Amazon
      var _this = this;
      var highlightsURL = "https://kindle.amazon.com/your_highlights";

      if(arguments.length == 0) {
        var callback = function() { log("No callback for login status. Nothing to do. (" + _this.amazonLoggedIn + ")");}
      }

      $("#amazon_logged_in").hide();
      $("#amazon_checking_login").show();

      $.get(highlightsURL, function(src) {
        $("#amazon_checking_login").hide();
        var source = $(src);
        if($(source).find("#ap_signin_form").length > 0) {
          log("User is logged out of Amazon!");
          _this.amazonLoggedIn = false;
        } else {
          log("User is logged into Amazon!");
          _this.amazonLoggedIn = true;
        }

        callback();
      }, "html");
    },

    amazonImportOptionDisplay: function() {
      var _this = this;
      log("showing import options...");

      if(this.settings.doKindleImport) {

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

    getBackgroundPage: function() {
      this.bkg = chrome.extension.getBackgroundPage();
      this.settings = this.bkg.FDGS.settings;
    },

    start: function() {
      var _this = this;

      log("Starting options page...");

      _this.getBackgroundPage();
      
      this.restore();

      $(".optionsList li input").click(function() { _this.save(); })

      $("#fdgs_login").click(function() { _this.findingsLogin(); })

      $("#fdgs_logout").click(function() { _this.findingsLogout(); });

      $("#doKindleImport").click(function(){
        if($(this).prop("checked")) {
          _this.getAmazonLoginStatus(function() {
            _this.amazonImportOptionDisplay();
          });
        } else {
          _this.amazonImportOptionDisplay();
        }
      });

      $("#amazon_import_interval").change(function() { _this.save(); });
    }
  }

  w.log = function(msg, use_ts) {
    if(chrome.extension.getBackgroundPage().FDGS.settings.logging_enabled) {
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
  };

  w.toBool = function(str) {
    if ("false" === str) {
      return false;
    } else {
      return str;
    }
  };

})(window);

$(document).ready(function() {
  opt.start();
});