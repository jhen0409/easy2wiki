function diffUsingJS(viewType, oldValue, newValue, eleid) {
	"use strict";
	var	base = difflib.stringAsLines(oldValue),
		newtxt = difflib.stringAsLines(newValue),
		sm = new difflib.SequenceMatcher(base, newtxt),
		opcodes = sm.get_opcodes(),
		diffoutputdiv = $('#' + eleid)[0],
		contextSize = null;

	$('#' + eleid).html('');
	contextSize = contextSize || null;

	diffoutputdiv.appendChild(diffview.buildView({
		baseTextLines: base,
		newTextLines: newtxt,
		opcodes: opcodes,
		baseTextName: "Old Text",
		newTextName: "New Text",
		contextSize: contextSize,
		viewType: viewType
	}));
}