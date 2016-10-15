// LICENSE : MIT
"use strict";
import {RuleHelper} from "textlint-rule-helper";
import StructuredSource from "structured-source";
const prh = require("prh");
const path = require("path");
const untildify = require('untildify');
function createPrhEngine(rulePaths, baseDir) {
    if (rulePaths.length === 0) {
        return null;
    }
    const expandedRulePaths = rulePaths.map(rulePath => untildify(rulePath));
    const prhEngine = prh.fromYAMLFilePath(path.resolve(baseDir, expandedRulePaths[0]));
    expandedRulePaths.slice(1).forEach(ruleFilePath => {
        const config = prh.fromYAMLFilePath(path.resolve(baseDir, ruleFilePath));
        prhEngine.merge(config);
    });
    return prhEngine;
}
function createPrhEngineFromContents(yamlContents) {
    if (yamlContents.length === 0) {
        return null;
    }
    const prhEngine = prh.fromYAML(null, yamlContents[0]);
    yamlContents.slice(1).forEach(content => {
        const config = prh.fromYAML(null, content);
        prhEngine.merge(config);
    });
    return prhEngine;
}
function mergePrh(...engines) {
    const engines_ = engines.filter(engine => !!engine);
    const mainEngine = engines_[0];
    engines_.slice(1).forEach(engine => {
        mainEngine.merge(engine);
    });
    return mainEngine;
}
const assertOptions = (options) => {
    if (typeof options.ruleContents === "undefined" && typeof options.rulePaths === "undefined") {
        throw new Error(`textlint-rule-prh require Rule Options.
Please set .textlinrc:
{
    "rules": {
        "prh": {
            "rulePaths" :["path/to/prh.yml"]
        }
    }
}
`);
    }
};
function reporter(context, options = {}) {
    assertOptions(options);
    const textlintRcFilePath = context.config ? context.config.configFile : null;
    // .textlinrc directory
    const textlintRCDir = textlintRcFilePath ? path.dirname(textlintRcFilePath) : process.cwd();
    // create prh config
    const rulePaths = options.rulePaths || [];
    const ruleContents = options.ruleContents || [];
    // yaml file + yaml contents
    const prhEngineContent = createPrhEngineFromContents(ruleContents);
    const prhEngineFiles = createPrhEngine(rulePaths, textlintRCDir);
    const prhEngine = mergePrh(prhEngineFiles, prhEngineContent);
    const helper = new RuleHelper(context);
    const {Syntax, getSource, report, fixer, RuleError} = context;
    return {
        [Syntax.Str](node){
            if (helper.isChildNode(node, [Syntax.Link, Syntax.Image, Syntax.BlockQuote, Syntax.Emphasis])) {
                return;
            }
            let text = getSource(node);
            // to get position from index
            let src = new StructuredSource(text);
            let makeChangeSet = prhEngine.makeChangeSet(null, text);
            makeChangeSet.diffs.forEach(function(changeSet) {
                // | ----[match]------
                var slicedText = text.slice(changeSet.index);
                // | ----[match------|
                var matchedText = slicedText.slice(0, changeSet.matches[0].length);
                var expected = matchedText.replace(changeSet.pattern, changeSet.expected);
                // Avoid accidental match(ignore case)
                if (matchedText === expected) {
                    return;
                }
                /*
                 line start with 1
                 column start with 0

                 adjust position => line -1, column +0
                 */
                var position = src.indexToPosition(changeSet.index);

                // line, column
                report(node, new RuleError(matchedText + " => " + expected, {
                    line: position.line - 1,
                    column: position.column,
                    fix: fixer.replaceTextRange([changeSet.index, changeSet.index + matchedText.length], expected)
                }));
            });
        }
    }
}
module.exports = {
    linter: reporter,
    fixer: reporter
};