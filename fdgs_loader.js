(function(w) {
	var date = new Date();
	w.FDGS = {
		tab: {},
		protocol: document.location.protocol + "//",
		loaded: false,
		started: date.getTime(),
        chrome_dir: "chrome/",

		log: function(msg, use_ts) {
	        if(localStorage['FDGS_LOGGING_ENABLED']) {
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

		loader: function() {
			var me = this;
			var r = "";
			
			if(localStorage['FDGS_DISABLE_CACHING']) {
				var d=new Date();
				r=d.getTime();
			}

			var e=document.createElement('script');
			var scriptURL =  FDGS.protocol + localStorage['FDGS_BASE_DOMAIN'] + '/extension/loader?'+r;
			FDGS.log("loading " + scriptURL);

			e.setAttribute('type','text/javascript');

			e.setAttribute('src', scriptURL);
			document.body.appendChild(e);	
		},

	    getLocalPage: function (page) {
	        return this.chrome_dir + b
	    },

        open_page: function (page) {
            chrome.tabs.create({
                url: chrome.extension.getURL(this.getLocalPage(page))
            })
        },

		start: function() {
			FDGS.log("Opening sidebar...");
			var me = this;
			me.loader();
		}
	};

	FDGS.start();

})(window);
