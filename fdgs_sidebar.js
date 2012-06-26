var FDGS_BASE_DOMAIN = "dev.findings.com";
var FDGS_LOGGING_ENABLED = true;
var FDGS_DISABLE_CACHING = false;

var FDGS = {};
	var date = new Date();
	
	FDGS = {
		tab: {},
		protocol: "http",
		loaded: false,
		started: date.getTime(),

		log: function(msg, use_ts) {
            if(FDGS_LOGGING_ENABLED) {
                if(typeof(use_ts) == "undefined") use_ts = true;
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

		setProtocol: function(tab) { 
			var me = this;
			if(window.search.indexOf("https") > 0) {
				me.protocol = "https";
			}
		}, 

		loader: function() {
			var me = this;
			var d=new Date();
			var r=d.getTime();
			var e=document.createElement('script');
			var scriptURL = document.location.protocol + "//" + FDGS_BASE_DOMAIN + '/extension/loader?'+r;
			FDGS.log("loading " + scriptURL);

			e.setAttribute('type','text/javascript');

			e.setAttribute('src', scriptURL);
			document.body.appendChild(e);	
		},

		start: function() {
			var me = this;
			me.loader();
		}
	}

	FDGS.log("Opening sidebar...");
	FDGS.start();
