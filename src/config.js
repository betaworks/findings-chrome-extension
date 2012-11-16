// This is the first key that we used. This was set to default off. We'll deprecate using this one
// in favor of the _production one when we release this officially
// var LSK_INLINE_HIGHLIGHTING_ENABLED = 'inline_highlighting_enabled';
var LSK_INLINE_HIGHLIGHTING_ENABLED_PRODUCTION = 'inline_highlighting_enabled_production';
var LSK_FIRST_RUN = 'first_run';

var config = {

    // Base URL for findings
    get findingsBaseURL(){
        return 'https://findings.com';
    },

    // First run
    get extensionFirstRun(){
        if (typeof(localStorage[LSK_FIRST_RUN]) === 'undefined'){
            localStorage[LSK_FIRST_RUN] = 'true';
        }

        return localStorage[LSK_FIRST_RUN] === 'true' ? true : false;
    },

    set extensionFirstRun(value){
        localStorage[LSK_FIRST_RUN] = value;
    },

    // Inline Highlighting Option
    get inlineHighlightingEnabled(){
        if (typeof(localStorage[LSK_INLINE_HIGHLIGHTING_ENABLED_PRODUCTION]) === 'undefined'){
            localStorage[LSK_INLINE_HIGHLIGHTING_ENABLED_PRODUCTION] = 'true';
        }

        return localStorage[LSK_INLINE_HIGHLIGHTING_ENABLED_PRODUCTION] === 'true' ? true : false;
    },

    set inlineHighlightingEnabled(value){
        localStorage[LSK_INLINE_HIGHLIGHTING_ENABLED_PRODUCTION] = value;
    }

}
