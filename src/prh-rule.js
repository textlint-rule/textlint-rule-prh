// LICENSE : MIT
"use strict";
import {RuleHelper} from "textlint-rule-helper";
import StructuredSource from "structured-source"
import prh from "prh";
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
    let helper = new RuleHelper(context);
    let {Syntax, getSource, report, RuleError} = context;
    var rulePaths = options.rulePaths;
    var config = prh.fromYAMLFilePath(rulePaths[0]);
    rulePaths.splice(1).forEach(function (path) {
        var c = prh.fromYAMLFilePath(path);
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
            makeChangeSet.forEach(function (changeSet) {
                var position = src.indexToPosition(changeSet.index);
                // line, column
                context.report(node, new context.RuleError(changeSet.matches[0] + " => " + changeSet.expected, {
                    line: position.line - 1,// == start with 0
                    column: position.column// == start with 0
                }));
            });
        }
    }
}