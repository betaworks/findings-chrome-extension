var kindle_importer = {
	highlightsURL: "https://kindle.amazon.com/your_highlights",
	nextPageURL: "https://kindle.amazon.com/your_highlights/next_book",
	nextPageData: {"used_asins": [], "upcoming_asins": [], "offset": 0},
	content: {},
	upcomingAsins: [],
	usedAsins: [],
	processedAsins: [],
	importData: [],
	readyToSend: false,
    currentBook: {"asin": "", "coverImg": "", "processing": false, "init": function(asin) {this.asin = asin; this.coverImg=""; this.processing=false; }},
    highlight_total: -1,
    importKey: -1,
    post_url: "//" + this.baseDomain + "/bookmarklet/kindlesync/" + this.import_key,
    amazonLoggedIn: false,

	// paginate: function() {
	// 	readyForNextBook=false;
	// 	var a={
	// 		"used_asins[]":usedAsins,
	// 		current_offset:currentOffset
	// 	};
	// 	if(upcomingAsins.length>0){
	// 		a["upcoming_asins[]"]=upcomingAsins
	// 	}
	// 	$.ajax({
	// 		url:"https://kindle.amazon.com/your_highlights/next_book",
	// 		data:a,
	// 		success:function(e){
	// 			if(e.length==0){
	// 				$("#stillLoadingBooks").remove()
	// 			} else {
	// 				$("#allHighlightedBooks").append(e);
	// 				var d=e.indexOf('id="',0)+4;
	// 				var b=e.indexOf('"',d);
	// 				var c=$("#"+e.substring(d,b));
	// 				recordLatestState(c);
	// 				if(nearPageBottom()){
	// 					addNextBook()
	// 				} else {
	// 					readyForNextBook=true
	// 				}
	// 			}
	// 		}
	// 	}
	// )},

	getUpcomingAsins: function() {
		var body = $("body");
		return body.find(".upcoming").text().split(",")

	},

	getUsedAsins: function() {
		var body = $("body");
		if (body.find(".skipped").size() == 1) {
		    this.usedAsins.push(body.find(".skipped").text())
		}
	},

	//AMAZON'S PAGINATION CODE
	// addNextBook: function() {
	// 	readyForNextBook=false;
	// 	var a={
	// 		"used_asins[]":usedAsins,
	// 		current_offset:currentOffset
	// 	};
	// 	if(upcomingAsins.length>0){
	// 		a["upcoming_asins[]"]=upcomingAsins
	// 	}
	// 	$.ajax({
	// 		url:"https://kindle.amazon.com/your_highlights/next_book",
	// 		data:a,
	// 		success:function(e){
	// 			if(e.length==0){
	// 				$("#stillLoadingBooks").remove()
	// 			} else {
	// 				$("#allHighlightedBooks").append(e);
	// 				var d=e.indexOf('id="',0)+4;
	// 				var b=e.indexOf('"',d);
	// 				var c=$("#"+e.substring(d,b));
	// 				recordLatestState(c);
	// 				if(nearPageBottom()){
	// 					addNextBook()
	// 				} else {
	// 					readyForNextBook=true
	// 				}
	// 			}
	// 		}
	// 	});
	// },

	getNextPage: function() {
		FDGS.log("Getting next page...");
		var _this = this;
		var page = {};
		if(!_this.readyToSend) {
			$.get(_this.nextPageURL, _this.nextPageData, function(src) {
				page = $(src);
				//FDGS.log(src);
				_this.upcomingAsins = page.find(".upcoming").text().split(","); //from Amazon's own code
				if(_this.upcomingAsins.length > 0) {
					_this.nextPageData["upcoming_asins[]"] = _this.upcomingAsins;
				} else {
					_this.readyToSend = true;
				}
				var bookMains = page.filter(".bookMain");
				_this.getBooks(bookMains);
			}, "html");
		} else {
			FDGS.log("About to send all highlights to Findings...", true);
			FDGS.log(_this.importData);
		}
	},

	getBooks: function(bookMains) {
        var _this = this;
        //FDGS.log(content);
		//
		// if(bookMains.length == 0) {
		// 	bookMains = $(content);
		// }

        FDGS.log(bookMains);

        bookMains.each(function() {
            var currBookMain = $(this);
            var currAsin = $(this).attr("id").substring(0, $(this).attr("id").lastIndexOf("_"));
            var coverImg = "http://images.amazon.com/images/P/" + currAsin + ".01.TZZ.jpg";
            var offset = $(this).attr("id").split("_")[1];
            FDGS.log("offset = " + offset);
            _this.nextPageData.offset = offset;
            
            if($.inArray(currAsin, _this.processedAsins) < 0) {
                FDGS.log("\n\nfound new book: " + currAsin);
                _this.currentBook.init(currAsin);
                _this.getHighlightJSON(currBookMain, currAsin, function() {
                    _this.processedAsins.push(currAsin);
                    _this.nextPageData.used_asins.push(currAsin);
                    _this.getNextPage();
                    //_this.nextPageURL = "https://kindle.amazon.com/your_highlights/next_book"; //needs to be passed without querystring after the first page
                });
            } else {
            	FDGS.log("Duplicate book found! ASIN: " + currAsin);
            }
        });
    },

    
    getHighlightJSON: function(book, asin, callback) {
        var _this = this;
        var clipdata = [];

        //replace HTML control chars
        var title = book.find(".title").text();
        title = _this.htmlZap($.trim(title));
        
        //get rid of all the extra chars and "by", and replace HTML control chars
        //var author = book.find(".author").text().substr(9).trim();
        var author = book.find(".author").text().substr(9);
        author = _this.htmlZap($.trim(author));
        
        var lastHighlighted = book.find(".lastHighlighted").text();
        lastHighlighted = _this.htmlZap($.trim(lastHighlighted));
        strip_pos = lastHighlighted.indexOf(" on ") + 4;
        var cutoff_date = lastHighlighted.substr(strip_pos);
        
        FDGS.log('Gathering highlights for "' + title + '"');
        
        book.nextUntil(".bookMain").each(function() {
            
            var highlight = $(this).find("span.highlight");
            
            //it's not a highlight but a note...we won't get much context but at least it's something.
            if(highlight.length == 0) highlight = $(this).find("span.context");
            
            //sometimes highlights are just notes (a full clip isn't display...just a few words for context.  We'll skip these 
            if(highlight.length == 0) {
                FDGS.log("empty highlight found...clips from this source are probably disallowed by publisher.")
                return false;
            } else {
                    locationLink = highlight.siblings("a.linkOut");
                    read_href = $.trim(locationLink.attr("href"));
                    locidx = read_href.indexOf("&location=") + 10;
                    loc = read_href.substr(locidx);

                    var content = $(highlight).html();
                    content = _this.htmlZap($.trim(content)); //replace tags w/ HTML entities (if we remove them people who highlight programming guides will be mad)
                        
                    var note = $(this).find(".noteContent").text();
                    if(note != null) note = $.trim(note);
                    
                    clip = {
                        "location": loc,
                        "content": content,
                        "note": note
                    }
                    clipdata.push(clip);
            }
        });

        var bookdata = {
            "asin": asin,
            "title": title,
            "author": author,
            "clipdata": clipdata,
            "cutoff_date": cutoff_date
        }

        _this.importData.push(bookdata);
        FDGS.log("PROCESSING '" + bookdata.title + "'");
        //FDGS.log(bookdata);
        
        var coverImg = "http://images.amazon.com/images/P/" + bookdata.asin + ".01.TZZ.jpg";

        //FDGS.log("Setting currentBook with data from " + bookdata.asin + "(" + bookdata.title + ")");
        _this.currentBook.asin = bookdata.asin;
        _this.currentBook.coverImg = coverImg;
        _this.currentBook.total = bookdata.clipdata.length;
        _this.currentBook.processing = true;
        
        //FDGS.log(_this.currentBook, false);

        FDGS.log('Found ' + bookdata.clipdata.length + ' highlights in "' + title + '"."');
        
        if(typeof(callback) != "undefined") callback();
    },

	beginImport: function() {
		var _this = this;

		$.get(_this.highlightsURL, function(src) {
			var source = $(src).filter("#wholePage");
			var all = $(source).find("#allHighlightedBooks");
			//_this.nextPageURL = "https://kindle.amazon.com" + $(source).find("#stillLoadingBooks~a").attr("href");
			_this.content = all;
			var bookMains = $(_this.content).find(".bookMain");
			_this.getBooks(bookMains);
		}, "html");
	},

	getAmazonLoggedInStatus: function() {
		//check to see if the user is logged into Amazon
	},

    //replace < > and & with HTML entities (need to be able to let users highlight HTML in programming references, so I'd rather not strip)
    htmlZap: function(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    },

	generateImportKey: function() {
		var username = FDGS.findingsUser.username || "noname";
		var d = new Date();
		key = d.getTime() + username;
		FDGS.log("This session's import key is " + key, true);
		return key;
	},

	start: function() {
		FDGS.log("Initiating background Kindle import...", true);
		this.importKey = this.generateImportKey();
		this.beginImport();
		return this;
	}
}
