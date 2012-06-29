var kindle_importer = {
	highlightsURL: "https://kindle.amazon.com/your_highlights",
	nextPageURL: "https://kindle.amazon.com/your_highlights/next_book",
	nextPageData: {"used_asins": [], "upcoming_asins": [], "offset": 0},
	content: {},
	upcomingAsins: [],
	usedAsins: [],
	processedAsins: [],
	statusDisplayQueue: [{"asin": "", "coverImg": "", "total": 0}],
	importData: [],
    currentBook: {"asin": "", "coverImg": "", "processing": false, "init": function(asin) {this.asin = asin; this.coverImg=""; this.processing=false; }},
    highlightTotal: 0,
    importKey: -1,
    postURL: "",
    statusURL: "",
	processing: false,
    amazonLoggedIn: false,


	getNextPage: function() {
		FDGS.log("Getting next page...");

		var _this = this;
		var page = {};
		if(_this.processing) {
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
			FDGS.log("Import complete!", true);
			_this.processing = false;
			//FDGS.log(_this.importData);
		}
	},

	getBooks: function(bookMains) {
        var _this = this;

        //FDGS.log(bookMains);

        bookMains.each(function() {
            var currBookMain = $(this);
            var currAsin = $(this).attr("id").substring(0, $(this).attr("id").lastIndexOf("_"));
            var coverImg = "http://images.amazon.com/images/P/" + currAsin + ".01.TZZ.jpg";
            var offset = $(this).attr("id").split("_")[1];
            _this.nextPageData.offset = offset;
            
            if($.inArray(currAsin, _this.processedAsins) < 0) {
                FDGS.log("\n\nfound new book: " + currAsin);
                _this.currentBook.init(currAsin);
                _this.getHighlightJSON(currBookMain, currAsin, function() {
                    _this.processedAsins.push(currAsin);
                    _this.nextPageData.used_asins.push(currAsin);
                    _this.postClipsForBook(); //calls getImportStatus, which calls getNextPage() if necessary
                });
            } else {
            	FDGS.log("Duplicate book found! ASIN: " + currAsin);
            }
        });
    },
    
    getHighlightJSON: function(book, asin, callback) {
        var _this = this;
        var clipdata = [];

		_this.importData = []; //clear out previously processed books

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

    postClipsForBook: function() {
    	var _this = this;

    	FDGS.log(_this.importData);

    	$.post(_this.postURL, {"clipdata": JSON.stringify(_this.importData)}, function() {
    		_this.getImportStatus();
    	});
    },

	getImportStatus: function() {
	    var _this = this;

	    $.getJSON(_this.statusURL, function(response) {
	        
	        var last_highlightTotal = _this.highlightTotal;
	        var docs = response.documents;
	        var active = false;
	        
	        if(response.active) {
	        	active = true;

	            if(docs.length > 0) {
	                if(docs[0].count > 0) _this.statusDisplayQueue.highlightTotal = 0; //reset total each time

	                //if($.inArray(_this.currentBook.asin, docs) && $.inArray(_this.currentBook.asin, _this.processed_asins) < 0) {
	                $.each(docs, function() {
	                    if($.inArray(this.asin, _this.statusDisplayQueue.displayed_asins) < 0 && $.inArray(this.asin, _this.statusDisplayQueue.upcoming_asins) < 0) {
	                        var book = {};
	                        var coverImg = "http://images.amazon.com/images/P/" + this.asin + ".01.TZZ.jpg";
	            
	                        book.asin = this.asin;
	                        book.coverImg = coverImg;
	                        book.total = this.count;

	                        _this.statusDisplayQueue.unshift(book);
	                        FDGS.log("added " + book.asin + " to list of books to display");
	                    }
	                });
	            }
	            

	            //update the aggregate total
	            for(var i=0; i<docs.length; i++) {
	                _this.highlightTotal += docs[i].count;
	            }

	            //now retrieve the next set of highlights
	            _this.getNextPage();

	        } else {
	            FDGS.log("import reported as closed")
	            _this.processing = false;
	        }
	    });
	    
	    if(typeof(callback) != "undefined") callback();
	},

	beginImport: function() {
		var _this = this;

		//we're now processsing highlights
		_this.processing = true;

		_this.getAmazonLoggedInStatus(function() {
			$.get(_this.highlightsURL, function(src) {
				var source = $(src).filter("#wholePage");
				var all = $(source).find("#allHighlightedBooks");
				//_this.nextPageURL = "https://kindle.amazon.com" + $(source).find("#stillLoadingBooks~a").attr("href");
				_this.content = all;
				var bookMains = $(_this.content).find(".bookMain");
				_this.getBooks(bookMains);
			}, "html");
		});
	},

	getAmazonLoggedInStatus: function(callback) {
		//check to see if the user is logged into Amazon

		if(arguments.length == 0) {
			var callback = function() { FDGS.log("No callback for login status. Nothing to do. (" + _this.amazonLoggedIn + ")");}
		}

		var _this = this;

		$.get(this.highlightsURL, function(src) {
			var source = $(src);
			if($(source).find("#ap_signin_form").length > 0) {
				_this.amazonLoggedIn = false;
			} else {
				_this.amazonLoggedIn = true;
			}
			callback();
		}, "html");
	},

    //replace < > and & with HTML entities (need to be able to let users highlight HTML in programming references, so I'd rather not strip)
    htmlZap: function(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    },

	generateImportKey: function() {
		var username = FDGS.findingsUser.username || "noname";
		var d = new Date();
		key = d.getTime() + username;
		return key;
	},

	start: function() {
		FDGS.log("Initiating background Kindle import...", true);
		this.importKey = this.generateImportKey();
		FDGS.log("This session's import key is " + this.importKey, true);
	    this.postURL = "https://" + FDGS.BASE_DOMAIN + "/bookmarklet/kindlesync/" + this.importKey,
	    this.statusURL =  "https://" + FDGS.BASE_DOMAIN + "/bookmarklet/kindlesync/" + this.importKey + "?callback=?",
		this.beginImport();
		return this;
	}
}
