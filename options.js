(function(w) {
  // Saves options to localStorage.
  w.opt = {
    findingsLoggedIn: false,
    amazonLoggedIn: false,
    bkg: {},

    save: function(callback) {
      log("Saving options...");
      var _this = this;

      if(arguments.length == 0) {
        var callback = function() {};
      }

      var badgeText = "";
      var lastAmazonImportInterval = _this.settings.amazonImportInterval;


      /*************************************************************/
      /*
        THIS IS DEV STUFF THAT SHOULD PROBABLY BE REMOVED OR HIDDEN
        WHEN THE EXTENSION IS RELEASED
      */

      _this.settings.isDev = toBool($("#isDev").prop("checked"));
      _this.settings.devDomain = $("#devDomain").val();

      //automatically set logging and caching to true if dev
      if(_this.settings.isDev) {
        _this.settings.logging_enabled = true;
        _this.settings.disabled_caching = true;
      } else { //production
        _this.settings.logging_enabled = false;
        _this.settings.disabled_caching = false;
      }

      /* END DEV STUFF */
      /*************************************************************/
      
      _this.settings.doKindleImport = toBool($("#doKindleImport").prop("checked"));
      
      _this.settings.amazonImportInterval = $("#amazon_import_interval_enabled option:selected").val();

      _this.settings.notificationsAmazonEnabledDesktop = $("#amazon_desktop_notifications_enabled").prop("checked");
      log("desktop notifications? " + $("#amazon_desktop_notifications_enabled").prop("checked"));
      log("desktop notifications setting: " + _this.settings.notificationsAmazonEnabledDesktop);

      _this.settings.notificationsAmazonEnabledEmail = $("#amazon_email_notifications_enabled").prop("checked");
      log("email notifications? " + $("#amazon_email_notifications_enabled").prop("checked"));
      log("email notifications setting: " + _this.settings.notificationsAmazonEnabledEmail);

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

      $("#isDev").prop("checked", _this.settings.isDev);
      $("#devDomain").val(_this.settings.devDomain);
      $("#doKindleImport").prop("checked", _this.settings.doKindleImport);
      $("#amazon_desktop_notifications_enabled").prop("checked", _this.settings.notificationsAmazonEnabledDesktop);
      $("#amazon_email_notifications_enabled").prop("checked", _this.settings.notificationsAmazonEnabledEmail);

      //get Findings login status
      _this.getFindingsLoginStatus();

      if(doKindleImport) {
        _this.getAmazonLoginStatus(false); //false == get status but do not execute import
      } else {
        //don't show the checking Amazon status
        $("#amazon_checking_login").hide();
      }

      $("#lastImportDate").html(_this.settings.lastImportDate);
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

    // getFindingsLoginStatus: function() {
    //   var _this = this;
    //   var userURL = "https://" + this.settings.base_domain + "/logged_in";
    //   $.getJSON(userURL, function(result) {
    //     //log(result);
    //     if(result.isLoggedIn) {
    //         _this.findingsLoggedIn = true;
    //         log("User is logged into Findings as user " + result.username);

    //         _this.bkg.FDGS.findingsUser = result;

    //         var userlink = "<a href='https://" + _this.settings.base_domain + "/" + result.username + "' target='blank'>" + result.username + "</a>";
    //         $("#fdgs_username_display").html(userlink);
    //         $("#fdgs_login_status .fdgs_logged_out").hide();
    //         $("#fdgs_login_status .fdgs_logged_in").show();
    //     } else {
    //         _this.findingsLoggedIn = false;
    //         log("User is logged out of Findings!");
    //         $("#fdgs_login_status .fdgs_logged_in").hide();
    //         $("#fdgs_login_status .fdgs_logged_out").show();
    //     }
    //   });
    // },

    getFindingsLoginStatus: function() {
      var _this = this;

      _this.bkg.FDGS.getFindingsLoginStatus(function(user) {
        if(user.isLoggedIn) {
            _this.findingsLoggedIn = true;
            log("User is logged into Findings as user " + user.username);

            var userlink = "<a href='https://" + _this.settings.base_domain + "/" + user.username + "' target='blank'>" + user.username + "</a>";
            $("#fdgs_username_display").html(userlink);
            $("#fdgs_login_status .fdgs_logged_out").hide();
            $("#fdgs_login_status .fdgs_logged_in").show();
        } else {
            _this.findingsLoggedIn = false;
            log("User is logged out of Findings!");
            $("#fdgs_login_status .fdgs_logged_in").hide();
            $("#fdgs_login_status .fdgs_logged_out").show();
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
        _this.bkg.FDGS.findingsUser = {};
        _this.getFindingsLoginStatus();
      }); 

    },

    getAmazonLoginStatus: function(startKindleImport) {
      //check to see if the user is logged into Amazon
      var _this = this;

      if(arguments.length == 0) {
        doKindleImport = false;
      }

      log("Getting login status from background page...");

      $("#amazon_logged_in").hide();
      $("#amazon_checking_login").show();

      _this.bkg.FDGS.getAmazonLoginStatus(function(isLoggedIn) {
        log("Logged into Amazon? " + isLoggedIn);
        _this.amazonLoggedIn = isLoggedIn;
        _this.amazonImportOptionDisplay();
        $("#amazon_checking_login").hide();
        if(startKindleImport) {
          _this.startKindleImport();
          //_this.refreshAmazonImportInterval();
        }
      });
    },

    amazonImportOptionDisplay: function() {
      var _this = this;
      log("showing import options...");

      //select the appropriate option for import interval regardless of login
      var amazonImportInterval = _this.settings.amazonImportInterval;
      var intervalChooser = document.getElementById("amazon_import_interval_enabled");

      switch(amazonImportInterval) {
        case "-1":
          intervalChooser.options[0].selected = true;
          break;
        case "720":
          intervalChooser.options[1].selected = true;
          break;
        case "168":
          intervalChooser.options[2].selected = true;
          break;
        case "24":
          intervalChooser.options[3].selected = true;
          break;
        case "12":
          intervalChooser.options[4].selected = true;
          break;
        case "1":
          intervalChooser.options[5].selected = true;
          break;
        case ".017":
          intervalChooser.options[6].selected = true;
          break;
      }

      if(this.settings.doKindleImport) {

        //kindle import is checked
        if(_this.amazonLoggedIn) {

          //show the interval options
          $("#amazon_import_interval_disabled").hide();
          $("#amazon_import_interval_enabled").show();

          //show the import options
          $("#amazon_logged_out").hide();
          $("#amazon_logged_in").show();

        } else {
          //do not show any import interval options
          $("#amazon_import_interval_enabled").hide();
          $("#amazon_import_Interval_disabled").hide();

          //show the login warning
          $("#amazon_logged_in").hide();
          $("#amazon_logged_out").show();

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

          //show the login warning
          $("#amazon_logged_in").hide();
          $("#amazon_logged_out").show();

          //do not show any import interval options
          $("#amazon_import_interval_enabled").hide();
          $("#amazon_import_Interval_disabled").hide();
        }

      }
    },

    startKindleImport: function() {
      var _this = this;
      log("User has enabled Kindle import!  Initiating...")
      _this.bkg.FDGS.startKindleImport(_this.bkg.FDGS);
      _this.refreshAmazonImportInterval();
    },

    refreshAmazonImportInterval: function() {
      var _this = this;

      log("Refreshing Kindle import timer...");
      _this.bkg.FDGS.killAmazonImportInterval();
      if(_this.settings.amazonImportInterval > 0) {
        _this.bkg.FDGS.createAmazonImportInterval();
      }
    },

    getBackgroundPage: function() {
      this.bkg = chrome.extension.getBackgroundPage();
      this.settings = this.bkg.FDGS.settings;
      //log(this.bkg.FDGS);
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
          _this.settings.amazonImportInterval = 24; //reset to once a day
          _this.getAmazonLoginStatus(true); //true == initiate import if necessary
        } else {
          _this.amazonImportOptionDisplay();
          //kill the import timer when disabling
          _this.settings.amazonImportInterval = -1;
          _this.refreshAmazonImportInterval();
        }
      });

      $("#amazon_import_interval_enabled").change(function() {
        _this.save(function() {
          _this.refreshAmazonImportInterval();
        });
      });
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