$(document).ready(function() {
    $("#inline_highlighting_enabled").prop('checked', config.inlineHighlightingEnabled);

    $("#inline_highlighting_enabled").change(function() {
        config.inlineHighlightingEnabled = $("#inline_highlighting_enabled").prop("checked");
        console.log("Inline Highlighting Endabled:", config.inlineHighlightingEnabled);
    });
});
