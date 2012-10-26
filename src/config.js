var LSK_INLINE_HIGHLIGHTING_ENABLED = 'inline_highlighting_enabled';
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
        if (typeof(localStorage[LSK_INLINE_HIGHLIGHTING_ENABLED]) === 'undefined'){
            localStorage[LSK_INLINE_HIGHLIGHTING_ENABLED] = 'false';
        }

        return localStorage[LSK_INLINE_HIGHLIGHTING_ENABLED] === 'true' ? true : false;
    },

    set inlineHighlightingEnabled(value){
        localStorage[LSK_INLINE_HIGHLIGHTING_ENABLED] = value;
    }

}
