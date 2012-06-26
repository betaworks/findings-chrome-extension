// The URL to submit a clipping to Findings.
var base = 'http://findings.com/submit';

// ----------------- Utility functions for context menus -----------------

function openNewTab(clipping, info, tab){
  /*
   * Create a new tab with Findings looking at the given clipping value.
   */
  chrome.tabs.create({
    url: makeURL(clipping, info),
    index: tab.index + 1
  });
}

function makeURL(clipping, info){
  /*
   * Generate a Findings clipping submission URL given a clipping value
   * and an info object containing information clipping the user event.
   */
  var referer = refererFragment(info);
  if (referer === ''){
    return base + '?' + clippingFragment(clipping);
  }
  else {
    return base + '?' + clippingFragment(clipping) + '&' + referer;
  }
}

function clippingFragment(clipping){
  /*
   * Produce a clipping=xxx URL fragment for a submission request to
   * Findings.
   */
  return 'clipping=' + encodeURIComponent(clipping);
}

function refererFragment(info){
  /*
   * Produce a url=xxx refering page URL fragment for a request to
   * Findings.
   */
  return info.pageUrl ? 'url=' + encodeURIComponent(info.pageUrl) : '';
}

// --------------------------- Selection handling ----------------------

function getClickHandlerSelection() {
  return function(info, tab){
    openNewTab(info.selectionText, info, tab);
  };
}

chrome.contextMenus.create({
  'title' : 'Submit "%s" to findings.com',
  'type' : 'normal',
  'contexts' : ['selection'],
  'onclick' : getClickHandlerSelection()
});
