(function(w) {
  // Saves options to localStorage.
  w.opt = {
    clickEgg: 0,
    useDomain: "findings.com",
    bkg: {},

    save: function(callback) {
      var _this = this;
      _this.log("Saving options...");
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
        _this.settings.disable_caching = true;
      } else { //production

        /***********************************************************
        ************* CHANGE THESE BEFORE YOU GO LIVE!!!! **********
        /**********************************************************/
        _this.settings.logging_enabled = false;
        _this.settings.disable_caching = false;
        // _this.settings.logging_enabled = false;
        // _this.settings.disabled_caching = false;
        /***********************************************************
        ************* CHANGE THESE BEFORE YOU GO LIVE!!!! **********
        /**********************************************************/        
      }

      /* END DEV STUFF */
      /*************************************************************/
      
      _this.settings.doKindleImport = toBool($("#doKindleImport").prop("checked"));
      
      _this.settings.amazonImportInterval = $("#amazon_import_interval_enabled option:selected").val();

      _this.settings.notificationsAmazonEnabledDesktop = $("#amazon_desktop_notifications_enabled").prop("checked");

      _this.settings.notificationsAmazonEnabledEmail = $("#amazon_email_notifications_enabled").prop("checked");

      _this.settings.amazonImportInterval = $("#amazon_import_interval_enabled option:selected").val();

      _this.bkg.FDGS.setEnvironment();

      callback();
    },

    // Restores select box state to saved value from localStorage.
    restore: function() {
      var _this = this;

      _this.log("Restoring options...");

      $("#isDev").prop("checked", _this.settings.isDev);
      $("#devDomain").val(_this.settings.devDomain);
      $("#doKindleImport").prop("checked", _this.settings.doKindleImport);

      _this.useDomain = _this.settings.base_domain;
      if(_this.settings.isDev) {
        _this.log("showing dev options...")
        $(".devopt").show();
        _this.useDomain = _this.settings.devDomain;
      } else {
        _this.log("hiding dev options...")
        $(".devopt").hide();
        $(".devimportopt").remove();
      }

      if(this.settings.doKindleImport) {
        _this.getAmazonLoginStatus(false); //false == get status but do not execute import
      } else {
        //don't show the checking Amazon status
        $("#amazon_logged_in").hide();
        $("#amazon_logged_out").hide();
        $("#findings_logged_out").hide();
        $("#amazon_checking_login").hide();
      }

      var lastImportDate, importDateText;

      if(_this.settings.lastImportDate != "never") {
        lastImportDate = new Date(_this.settings.lastImportDate);

        var friendlyTime;
        if(lastImportDate.getHours() > 12) {
          friendlyTime = lastImportDate.getHours()-12;
        } else {
          friendlyTime = lastImportDate.getHours();
        }
        friendlyTime += ":" + lastImportDate.getMinutes();
        if(lastImportDate.getHours() > 12) {
          friendlyTime += "pm";
        } else {
          friendlyTime +="am";
        }

        importDateText = lastImportDate.toLocaleDateString() + " at " + friendlyTime;
        
      } else {
        importDateText = _this.settings.lastImportDate;
      }
      
      $("#lastImportDate").html(importDateText);

      //load the login form
      document.getElementById("loginframe").src = "https://" + _this.useDomain + "/user/login/iframe/";      
    },

    update: function() {
      //run the functions necessary to set the environment, check login, etc.
      this.bkg.FDGS.setEnvironment();
      _this.getFindingsLoginStatus(function() {
        _this.amazonImportOptionDisplay();
      });
    },

    displayLoginCheckSpinner: function() {
      $("#amazon_logged_in").hide();
      $("#amazon_logged_out").hide();
      $("#findings_logged_out").hide();
      $("#amazon_checking_login").show();
    },

    getAmazonLoginStatus: function(initiateImport) {
      //check to see if the user is logged into Amazon
      var _this = this;
      var updateAmazonImportOptionDisplay = true;

      if(arguments.length == 0) {
        var startKindleImport = false;
      }

      _this.log("Getting login status from background page...");

      _this.displayLoginCheckSpinner();

      var stupidChromeBugTimer = window.setTimeout(function() { if(updateAmazonImportOptionDisplay) { _this.log('Background Amazon login failed to execute, displaying options anyway.'); _this.amazonImportOptionDisplay(); }}, 5000);

      _this.bkg.FDGS.getAmazonLoginStatus(function(isLoggedIn) {
        
        // Sometimes Chrome gets stuck and won't call/return data so the stupidChromeBugTimer will
        // update the import options display in 5 seconds if we don't hear back.
        updateAmazonImportOptionDisplay = false;
        window.clearTimeout(stupidChromeBugTimer);

        _this.log("Logged into Amazon? " + isLoggedIn);
        $("#amazon_checking_login").hide();
        _this.amazonImportOptionDisplay(isLoggedIn);

        if(initiateImport) {
          _this.startKindleImport();
        }
      });
    },

    amazonImportOptionDisplay: function(isLoggedInAmazon) {
      var _this = this;

      //select the appropriate option for import interval regardless of login
      var amazonImportInterval = _this.settings.amazonImportInterval;
      var $amazon_import_interval_enabled = $("#amazon_import_interval_enabled");

      $amazon_import_interval_enabled.val(_this.settings.amazonImportInterval);
      //if coming out of dev mode and the hourly and minute intervals no longer exist...
      if($("#amazon_import_interval_enabled option:selected").val() != amazonImportInterval) {
        $amazon_import_interval_enabled.val(24);
      }

      if(this.settings.doKindleImport) { //kindle import is enabled

        if(isLoggedInAmazon) { //logged into Amazon

          var findingsUser = _this.bkg.FDGS.findingsUser;
          _this.log(findingsUser);

          if(!findingsUser.authenticated) { //not logged into Findings
            $("#findings_logged_out").show();
            $("#amazon_logged_out").hide();
            $("#amazon_logged_in").hide();
          } else {
            $("#findings_logged_out").hide();
            $("#amazon_logged_out").hide();
            $("#amazon_logged_in").show();            
          }

        } else { //not logged into Amazon

          $("#findings_logged_out").hide();
          $("#amazon_logged_in").hide();
          $("#amazon_logged_out").show();

        }

      } else { //kindle import is disabled
          $("#findings_logged_out").hide();
          $("#amazon_logged_in").hide();
          $("#amazon_logged_out").hide();
      }
    },

    startKindleImport: function() {
      var _this = this;
      _this.log("Initiating Kindle import...")
      _this.bkg.FDGS.startKindleImport(_this.bkg.FDGS);
      _this.refreshAmazonImportInterval();
    },

    refreshAmazonImportInterval: function() {
      var _this = this;

      _this.log("Refreshing Kindle import timer...");
      _this.bkg.FDGS.killAmazonImportInterval();
      if(_this.settings.amazonImportInterval > 0) {
        _this.bkg.FDGS.createAmazonImportInterval();
      }
    },

    getBackgroundPage: function() {
      this.bkg = chrome.extension.getBackgroundPage();
      this.settings = this.bkg.FDGS.settings;
      //_this.log(this.bkg.FDGS);
    },

    log: function(msg, use_ts) {
      var _this = this;
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
    },

    start: function() {
      var _this = this;

      _this.log("Starting options page...");

      _this.getBackgroundPage();
      
      _this.restore();

      window.addEventListener("message", function(e){
        var action = e.data.action;
        switch(action) {
          case "updateImportOptions":
            _this.displayLoginCheckSpinner();
            //refresh the Amazon import options (due to a login or logout event)
            _this.bkg.FDGS.getFindingsLoginStatus(function() {
              _this.getAmazonLoginStatus(false);
            });
            break;
        }
      }, false);


      $(".optionsList li input").bind("click keyupfunction blur", function() { _this.save(); })

      $("#isDev").click(function() {
        if($(this).prop("checked")) {
          window.location = window.location;
        }
      });

      //$("#fdgs_login").click(function() { _this.findingsLogin(); })

      // $("#fdgs_username, #fdgs_password").keydown(function(evt){
      //   var key = (event.keyCode ? event.keyCode : event.which);
      //   if(key === 13) {
      //     evt.preventDefault();
      //     _this.findingsLogin();
      //   } else {
      //     return evt.key;
      //   }
      // });

      $("#fdgs_logout").click(function() { _this.findingsLogout(); });

      $("#refresh_options").click(function() { window.location = window.location; })

      $("#doKindleImport").click(function(){
        // reset counts for failed import attempts
        _this.settings.importAttemptFailedAmazonLogin = 0;
        _this.settings.importAttemptFailedFindingsLogin = 0;

        if($(this).prop("checked")) {
          _this.settings.amazonImportInterval = 24; //reset to once a day
          _this.getAmazonLoginStatus(true); //true == initiate import if necessary
        } else {
          _this.amazonImportOptionDisplay();
          //kill the import timer when disabling
          _this.settings.amazonImportInterval = -1;
          _this.refreshAmazonImportInterval();
          _this.bkg.FDGS.killAmazonPinger(); //stop pinging since they've turned off import

        }
      });

      $("#import_now").click(function() {
        _this.startKindleImport();
      });

      $("#amazon_import_interval_enabled").change(function() {
        _this.save(function() {
          _this.refreshAmazonImportInterval();
        });
      });

      $(".findings.options h2").click(function() {
        var $devopt = $(".devopt");
        if(_this.clickEgg == 2) {
          _this.clickEgg = 0;
          $devopt.show();
        } else {
          $devopt.hide();
          _this.clickEgg ++;
        }
      });
    }
  }


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