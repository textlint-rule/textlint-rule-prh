// LICENSE : MIT
"use strict";
import {RuleHelper} from "textlint-rule-helper";
import StructuredSource from "structured-source";
import prh from "prh";
import path from "path";
export default function (context, options) {
    if (typeof options === "undefined" || typeof options.rulePaths === "undefined") {
        throw new Error(`textlint-rule-prh require Rule Options.
Please set .textlinrc:
{
    "rules": {
        "prh": {
            "rulePaths" :["path/to/rule.yaml"]
        }
    }
}
`);
    }
    var configFilePath = context.config ? context.config.configFile : null;
    // .textlinrc directory
    var textlintRCDir = configFilePath ? path.dirname(configFilePath) : process.cwd();
    let helper = new RuleHelper(context);
    let {Syntax, getSource, report, RuleError} = context;
    var rulePaths = options.rulePaths.slice();
    var config = prh.fromYAMLFilePath(path.resolve(textlintRCDir, rulePaths[0]));
    rulePaths.slice(1).forEach(function (rulePath) {
        var c = prh.fromYAMLFilePath(path.resolve(textlintRCDir, rulePath));
        config.merge(c);
    });
    return {
        [Syntax.Str](node){
            if (helper.isChildNode(node, [Syntax.Link, Syntax.Image, Syntax.BlockQuote, Syntax.Emphasis])) {
                return;
            }
            let text = getSource(node);
            // to get position from index
            let src = new StructuredSource(text);
            let makeChangeSet = config.makeChangeSet(null, text);
            makeChangeSet.diffs.forEach(function (changeSet) {
                // | ----[match]------
                var slicedText = text.slice(changeSet.index);
                // | ----[match------|
                var matchedText = slicedText.slice(0, changeSet.matches[0].length);
                var expected = matchedText.replace(changeSet.pattern, changeSet.expected);
                // Avoid accidental match(ignore case, expected contain actual pattern)
                if (slicedText.indexOf(expected) === 0) {
                    return;
                }
                /*
                line start with 1
                column start with 0

                adjust position => line -1, column +0
                 */
                var position = src.indexToPosition(changeSet.index);

                // line, column
                report(node, new RuleError(changeSet.matches[0] + " => " + expected, {
                    line: position.line - 1,
                    column: position.column
                }));
            });
        }
    }
}