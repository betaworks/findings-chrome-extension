var extension_settings = function() {
	var toBool = function(str) {
		//localStorage values are always strings, let's make sure we get booleans
		//don't forget to use this!
		if ("false" === str) {
			return false;
		} else if("true" === str) {
			return true;
		} else {
			return str;
		}
	};

	var settings = {
		log: function() {
			console.log("*** EXTENSION SETTINGS ***");
			console.log("base_domain: " + this.base_domain);
			console.log("isDev: " + this.isDev);
			console.log("devDomain: " + this.devDomain);
			console.log("logging_enabled: " + this.logging_enabled);
			console.log("disabled_caching: " + this.disabled_caching);
			console.log("doKindleImport: " + this.doKindleImport);
			console.log("notificationsAmazonEnabledDesktop: " + this.notificationsAmazonEnabledDesktop);
			console.log("notificationsAmazonEnabledEmail: " + this.notificationsAmazonEnabledEmail);
			console.log("\n");
		},

		get base_domain() {
			if(typeof(localStorage['FDGS_LOGGING_ENABLED']) == "undefined") {
				return true;
			} else {
				return localStorage['FDGS_BASE_DOMAIN'] || "findings.com";
			}
		},

		set base_domain(val) {
			localStorage['FDGS_BASE_DOMAIN'] = val;
		},

		get logging_enabled() {
			if(typeof(localStorage['FDGS_LOGGING_ENABLED']) == "undefined") {
				return true;
			} else {
				return toBool(localStorage['FDGS_LOGGING_ENABLED']) || false;
			}
		},

		set logging_enabled(val) {
			localStorage['FDGS_LOGGING_ENABLED'] = val;
		},

		get disabled_caching() {
			if(typeof(localStorage['FDGS_DISABLE_CACHING']) == "undefined") {
				return false;
			} else {
				return toBool(localStorage['FDGS_DISABLE_CACHING']);
			}
		},

		set disabled_caching(val) {
			localStorage['FDGS_DISABLE_CACHING'] = val;
		},

		get isDev() {
			if(typeof(localStorage['isDev']) == "undefined") {
				return false;
			} else {
				return toBool(localStorage['isDev']);
			}
		},

		set isDev(val) {
			localStorage['isDev'] = val;
		},

		get devDomain() {
			if(typeof(localStorage['devDomain']) == "undefined") {
				return "dev.findings.com";
			} else {
				return localStorage['devDomain'];
			}
		},

		set devDomain(val) {
			localStorage['devDomain'] = val;
		},

		get doKindleImport() {
			if(typeof(localStorage['doKindleImport']) == "undefined") {
				return false;
			} else {
				return toBool(localStorage['doKindleImport']);
			}
		},

		set doKindleImport(val) {
			localStorage['doKindleImport'] = val;
		},

		get amazonImportInterval() {
			if(typeof(localStorage['doKindleImport']) == "undefined") {
				return -1;
			} else {
				return localStorage['amazonImportInterval'];
			}
		},

		set amazonImportInterval(val) {
			localStorage['amazonImportInterval'] = val;
		},

		get lastImportDate() {
			if(typeof(localStorage['doKindleImport']) == "undefined") {
				return "never";
			} else {
				return localStorage['lastImportDate'];
			}
		},

		set lastImportDate(val) {
			//please don't use this...it's only for completeness.
			//use updateLastImportDate();
			localStorage['lastImportDate'] = val;
		},

		updateLastImportDate: function() {
			var now = new Date(); 
			var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
			localStorage['lastImportDate'] = now_utc;
		},

		get notificationsAmazonEnabledDesktop() {
			if(typeof(localStorage['notificationsAmazonEnabledDesktop']) == "undefined") {
				return true;
			} else {
				return toBool(localStorage['notificationsAmazonEnabledDesktop']);
			}
		},

		set notificationsAmazonEnabledDesktop(val) {
			localStorage['notificationsAmazonEnabledDesktop'] = val;
		},

		get notificationsAmazonEnabledEmail() {
			if(typeof(localStorage['notificationsAmazonEnabledEmail']) == "undefined") {
				return true;
			} else {
				return toBool(localStorage['notificationsAmazonEnabledEmail']);
			}
		},

		set notificationsAmazonEnabledEmail(val) {
			localStorage['notificationsAmazonEnabledEmail'] = val;
		}
	};

	return settings;
}