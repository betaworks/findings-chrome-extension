// Using the excellent highlighter code from Raymond Hill
// Author: Raymond Hill
// Version: 2011-01-17
// Title: HTML text hilighter
// Permalink: http://www.raymondhill.net/blog/?p=272
// Purpose: Hilight portions of text inside a specified element, according to a search expression.
// Key feature: Can safely hilight text across HTML tags.
// History:
//   2012-01-29
//     fixed a bug which caused special regex characters in the
//     search string to break the highlighter

function doHighlight(node,className,clipID,searchFor,which){
    var doc = document;

    // normalize node argument
    if (typeof node === 'string') {
        node = doc.getElementById(node);
        }

    // normalize search arguments, here is what is accepted:
    // - single string
    // - single regex (optionally, a 'which' argument, default to 0)
    if (typeof searchFor === 'string') {
        // rhill 2012-01-29: escape regex chars first
        // http://stackoverflow.com/questions/280793/case-insensitive-string-replacement-in-javascript
        searchFor = new RegExp(searchFor.replace(/[.*+?|()\[\]{}\\$^]/g,'\\$&'),'ig');
        }
    which = which || 0;

    // initialize root loop
    var indices = [],
        text = [], // will be morphed into a string later
        iNode = 0,
        nNodes = node.childNodes.length,
        nodeText,
        textLength = 0,
        stack = [],
        child, nChildren,
        state;
    // collect text and index-node pairs
    for (;;){
        while (iNode<nNodes){
            child=node.childNodes[iNode++];
            // text: collect and save index-node pair
            if (child.nodeType === 3){
                indices.push({i:textLength, n:child});
                nodeText = child.nodeValue;
                text.push(nodeText);
                textLength += nodeText.length;
                }
            // element: collect text of child elements,
            // except from script or style tags
            else if (child.nodeType === 1){
                // skip style/script tags
                if (child.tagName.search(/^(script|style)$/i)>=0){
                    continue;
                    }
                // add extra space for tags which fall naturally on word boundaries
                if (child.tagName.search(/^(a|b|basefont|bdo|big|em|font|i|s|small|span|strike|strong|su[bp]|tt|u)$/i)<0){
                    text.push(' ');
                    textLength++;
                    }
                // save parent's loop state
                nChildren = child.childNodes.length;
                if (nChildren){
                    stack.push({n:node, l:nNodes, i:iNode});
                    // initialize child's loop
                    node = child;
                    nNodes = nChildren;
                    iNode = 0;
                    }
                }
            }
        // restore parent's loop state
        if (!stack.length){
            break;
            }
        state = stack.pop();
        node = state.n;
        nNodes = state.l;
        iNode = state.i;
        }

    // quit if found nothing
    if (!indices.length){
        return;
        }

    // morph array of text into contiguous text
    text = text.join('');

    // sentinel
    indices.push({i:text.length});

    // find and hilight all matches
    var iMatch, matchingText,
        iTextStart, iTextEnd,
        i, iLeft, iRight,
        iEntry, entry,
        parentNode, nextNode, newNode,
        iNodeTextStart, iNodeTextEnd,
        textStart, textMiddle, textEnd;

    // loop until no more matches
    for (;;){

        // find matching text, stop if none
        matchingText = searchFor.exec(text);
        if (!matchingText || matchingText.length<=which || !matchingText[which].length){
            break;
            }

        // calculate a span from the absolute indices
        // for start and end of match
        iTextStart = matchingText.index;
        for (iMatch=1; iMatch < which; iMatch++){
            iTextStart += matchingText[iMatch].length;
            }
        iTextEnd = iTextStart + matchingText[which].length;

        // find entry in indices array (using binary search)
        iLeft = 0;
        iRight = indices.length;
        while (iLeft < iRight) {
            i=iLeft + iRight >> 1;
            if (iTextStart < indices[i].i){iRight = i;}
            else if (iTextStart >= indices[i+1].i){iLeft = i + 1;}
            else {iLeft = iRight = i;}
            }
        iEntry = iLeft;

        // for every entry which intersect with the span of the
        // match, extract the intersecting text, and put it into
        // a span tag with specified class
        while (iEntry < indices.length){
            entry = indices[iEntry];
            node = entry.n;
            nodeText = node.nodeValue;
            parentNode = node.parentNode;
            nextNode = node.nextSibling;
            iNodeTextStart = iTextStart - entry.i;
            iNodeTextEnd = Math.min(iTextEnd,indices[iEntry+1].i) - entry.i;

            // slice of text before hilighted slice
            textStart = null;
            if (iNodeTextStart > 0){
                textStart = nodeText.substring(0,iNodeTextStart);
                }

            // hilighted slice
            textMiddle = nodeText.substring(iNodeTextStart,iNodeTextEnd);

            // slice of text after hilighted slice
            textEnd = null;
            if (iNodeTextEnd < nodeText.length){
                textEnd = nodeText.substr(iNodeTextEnd);
                }

            // update DOM according to found slices of text
            if (textStart){
                node.nodeValue = textStart;
                }
            else {
                parentNode.removeChild(node);
                }
            newNode = doc.createElement('span');
            newNode.appendChild(doc.createTextNode(textMiddle));
            newNode.className = className;
            newNode.setAttribute('rel', clipID);
            parentNode.insertBefore(newNode,nextNode);
            if (textEnd){
                newNode = doc.createTextNode(textEnd);
                parentNode.insertBefore(newNode,nextNode);
                indices[iEntry] = {n:newNode,i:iTextEnd}; // important: make a copy, do not overwrite
                }

            // if the match doesn't intersect with the following
            // index-node pair, this means this match is completed
            iEntry++;
            if (iTextEnd <= indices[iEntry].i){
                break;
                }
            }
        }
    }

function quickHighlight(clipID, textToFind){
    textToFind = textToFind.trim();
    search_for = new RegExp(textToFind.replace(/[.*+?|()\[\]{}\\$^]/g,'\\$&').replace(/\s+/g,'\\s+'),'ig');
    doHighlight(document, 'findings-highlight findings-highlight-' + clipID, clipID, search_for);
}

function tagUsersWithHighlightsInView(){
    $('.findings-highlight').each(function(i, e){
        var isInViewport = function(element){
            var pageTop = $(window).scrollTop();
            var pageBottom = $(window).scrollTop() + $(window).height();
            var clipTop = $(element).offset().top;
            var clipBottom = clipTop + $(element).height();
            return (clipTop <= pageBottom) && (clipTop >= pageTop) ||
                    (clipBottom >= pageTop) && (clipBottom <= pageBottom);
        }

        var clip_id = $(e).attr('rel');
        $('#findings-person-' + clip_id).parents('.person_container').toggleClass('highlight', isInViewport(e));

    });
}


function armFindingsControls() {
    $('#findings-control .person_container .inner_container').mouseenter(function() {
        var rel = $(this).find('.person').attr('rel');
        $('.findings-highlight-' + rel).toggleClass('active', true);
        $('.findings-comments-' + rel).toggleClass('active', true);
        $(this).parent().toggleClass('active', true);
    });
    $('#findings-control .person_container .inner_container').mouseleave(function() {
        var rel = $(this).find('.person').attr('rel');
        $('.findings-highlight-' + rel).toggleClass('active', false);
        $('.findings-comments-' + rel).toggleClass('active', false);
        $(this).parent().toggleClass('active', false);
    });
    $('#findings-control .highlighter_box').click(function() {
        chrome.extension.sendMessage({'action': 'loadBookmarklet'});
    });
    $('#findings-control .close_highlight_box').click(function() {
        $('.findings-highlight').toggleClass('disabled', true);
        $('#findings-control').remove();
    });
    $('.person_container .name').mouseenter(function() {
        $('.person_container').toggleClass('active', false);
    });
    $('.findings-highlight').mouseenter(function() {
        var rel = $(this).attr('rel');
        $('.findings-highlight-' + rel).toggleClass('active', true);
        $('.findings-comments-' + rel).toggleClass('active', true);
        $('#findings-control .person[rel=' + rel + ']').parents('.person_container').toggleClass('highlight_hover', true);
    });
    $('.findings-highlight').mouseleave(function() {
        var rel = $(this).attr('rel');
        $('.findings-highlight').toggleClass('active', false);
        $('.findings-comments-' + rel).toggleClass('active', false);
        $('#findings-control .person').parents('.person_container').toggleClass('highlight_hover', false); 
    });

    // Tag users with hightlights initially in view
    tagUsersWithHighlightsInView();

    // Then tag users on scroll
    $(window).scroll(function() {
        tagUsersWithHighlightsInView();
    });

    $('#findings-control .person_container .quote_box').click(function() {
        var rel = $(this).attr('rel');
        var $first = $('.findings-highlight-' + rel).first();
        var offset = $first.offset().top;
        $('html,body').animate({ scrollTop: offset - 60 }, 200);
    });

    // Position the comments for a clip after the last highlighted
    // span that represents the clip
    $('.findings-comments').each(function() {
        var rel = $(this).attr('rel');
        var $highlight = $('.findings-highlight-' + rel).last();
        var top_offset = $highlight.offset().top;
        var left_offset = $highlight.offset().left;
        var highlight_height = $highlight.height();
        var bottom_offset = top_offset + highlight_height + 2;
        $(this).css({
            "left": left_offset,
            "top": bottom_offset
        });
    });
}

function handleClipFetch(data){
    var logo = "background-image: url('" + chrome.extension.getURL('images/logo_small_bar.png') + "');";
    var control_actions = "background-image: url('" + chrome.extension.getURL('images/action_sprites.png') + "');";
    var user_actions = "background-image: url('" + chrome.extension.getURL('images/action_sprites.png') + "');";

    var c = '';
    c += '<div id="findings-control">';
    c +=     '<div class="logo_container">';
    c +=        '<div class="inner_container">'
    c +=            '<div class="highlight_settings" title="Settings" style="' + control_actions +'"></div>'
    c +=            '<div class="close_highlight_box" title="Close" style="' + control_actions +'"></div>'
    c +=            '<a href="http://findings.com" target="_blank" title="Findings" id="logo" style="' + logo + '"></a>';
    c +=        '</div>'
    c +=     '</div>';
    c +=     '<div title="Create quote" class="highlighter_box" style="' + control_actions +'"></div>'
    c += '</div>';

    //
    // Don't add the findings control container just yet... we'll wait until we know there are clips to show
    //

    // First do the highlighting, so we can then see what order the page is in
    for (key in data.clips){
        var clip = data.clips[key];
        quickHighlight(clip.id, clip.content);
    }

    // Organize the clips in the order that they are on the page
    clip_hash = {}
    clip_order = []
    $('.findings-highlight').each(function(i, e){
        var id = e.getAttribute('rel');
        if (!clip_hash[id]){
            clip_order.push(id);
            clip_hash[id] = id;
        }
    });

    // Only put up the controls if we've actually found highlights
    if (clip_order.length > 0){
        $('body').append(c);
    }

    for (var i=0; i < clip_order.length; i++){
        var clip = data.clips[clip_order[i]];
        var username = clip.user__username;
        var fullname = clip.user__fullname;
        var image = clip.user__image;

        var p = '';
        p += '<div class="person_container">';
        p += '<div class="inner_container">';
        p += '<div class="person_cover"></div>'
        p += '<a href="https://findings.com/' + username + '/" target="_blank" title="View user on Findings" class="person highlight-adam" rel="'+ clip.id +'" style="background-image: url(\'' + image + '\');" id="findings-person-' + clip.id + '"></a>';
        p += '<a href="http://findings.com'+ clip.url +'" target="_blank" title="View quote on Findings" class="link_box" style="' + user_actions + '"></a>';
        p += '<div title="Scroll to quote" class="quote_box" rel="' + clip.id + '" style="' + user_actions + '"></div>';
        p += '<div class="name">' + fullname + '</div>';
        p += '</div>';
        p += '<div class="marker"></div>'
        p += '</div>';

        $('#findings-control').append(p);

        var comments = clip.comments;
        if (comments.length > 0){
            var c = '';
            c += '<div class="findings-comments findings-comments-' + clip.id + '" rel="' + clip.id + '">';
            for (var j=0; j < comments.length; j++){
                var comment = comments[j]
                var comment_user_image = comment.user__image;
                c += '<div class="findings-comment">';
                c += '<div class="comment-image" style="background-image: url(\'' + comment_user_image + '\');"></div>';
                c += '<div class="comment-content">' + comment.content + '</div>';
                c += '</div>';
            }
            c += '</div>'
            $('body').append(c);
        }
    }

    if (clip_order.length > 0){
        armFindingsControls();
    }
}

function doInlineHighlighting(whitelist){
    var host = document.location.host
    console.log("Document Referer:", document.referrer);
    var whitelisted = false;

    var domainParts = host.split('.')
    var subDomain = domainParts[domainParts.length-1]
    for (var i = domainParts.length-2; i >= 0; i--){
        subDomain = domainParts[i] + '.' + subDomain
        if (typeof(whitelist[subDomain]) !== 'undefined'){
            whitelisted = true;
            console.log(host, "(", subDomain, ")", "is whitelisted");
            break;
        }
    }
    if ( whitelisted || document.referrer ){
        a = document.createElement('a');
        a.href = document.referrer;
        referring_host = a.host;

        console.log("Referring host:", referring_host);
        if (whitelisted || referring_host.search('findings.com') > -1){
            data = {
                url: document.location.href,
                canonical: $('link[rel="canonical"]').attr('href') || ''
            }
            $.ajax({
                url: 'https://highlights.findings.com/source/inline_highlights/',
                type: 'POST',
                data: data,
                success: function(data){
                    handleClipFetch(data);
                }
            });
        } else if (!whitelisted){
            console.log("This was not referred from findings.com, and", host, "is not whitelisted");
        }
    } else if (!whitelisted){
        console.log("This page has no referrer, and", host, "is not whitelisted");
    }
}

$( function(){
    chrome.extension.sendMessage({action: "checkInlineHighlightingEnabled"}, function(response) {
        console.log("Inline Highlighting Enabled:", response.inlineHighlightingEnabled);
        if (response.inlineHighlightingEnabled){
            doInlineHighlighting(response.whitelist);
        }
    });
});
