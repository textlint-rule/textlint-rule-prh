// LICENSE : MIT
import { RuleHelper } from "textlint-rule-helper";
import { parse } from "@babel/parser";
import { fromYAMLFilePath, fromYAML } from "prh";
import path from "node:path";
import os from "node:os";

const homeDirectory = os.homedir();

const untildify = (filePath) => {
    return homeDirectory ? filePath.replace(/^~(?=$|\/|\\)/, homeDirectory) : filePath;
};
const defaultOptions = {
    checkLink: false,
    checkBlockQuote: false,
    checkEmphasis: false,
    checkHeader: true,
    checkParagraph: true,
    /**
     * Check CodeBlock text
     * Default: []
     */
    checkCodeComment: [],
    /**
     * Report parsing error for debug
     */
    debug: false
};

function createPrhEngine(rulePaths, baseDir) {
    if (rulePaths.length === 0) {
        return null;
    }
    const expandedRulePaths = rulePaths.map((rulePath) => untildify(rulePath));
    const prhEngine = fromYAMLFilePath(path.resolve(baseDir, expandedRulePaths[0]));
    expandedRulePaths.slice(1).forEach((ruleFilePath) => {
        const config = fromYAMLFilePath(path.resolve(baseDir, ruleFilePath));
        prhEngine.merge(config);
    });
    return prhEngine;
}

function createPrhEngineFromContents(yamlContents) {
    if (yamlContents.length === 0) {
        return null;
    }
    const dummyFilePath = "";
    const prhEngine = fromYAML(dummyFilePath, yamlContents[0]);
    yamlContents.slice(1).forEach((content) => {
        const config = fromYAML(dummyFilePath, content);
        prhEngine.merge(config);
    });
    return prhEngine;
}

function mergePrh(...engines) {
    const engines_ = engines.filter((engine) => !!engine);
    const mainEngine = engines_[0];
    engines_.slice(1).forEach((engine) => {
        mainEngine.merge(engine);
    });
    return mainEngine;
}

const assertOptions = (options) => {
    if (typeof options.ruleContents === "undefined" && typeof options.rulePaths === "undefined") {
        throw new Error(`textlint-rule-prh require Rule Options.
Please set .textlintrc:
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

const createIgnoreNodeTypes = (options, Syntax) => {
    const nodeTypes = [];
    if (!options.checkLink) {
        nodeTypes.push(Syntax.Link);
    }
    if (!options.checkBlockQuote) {
        nodeTypes.push(Syntax.BlockQuote);
    }
    if (!options.checkEmphasis) {
        nodeTypes.push(Syntax.Emphasis);
    }
    if (!options.checkHeader) {
        nodeTypes.push(Syntax.Header);
    }
    if (!options.checkParagraph) {
        nodeTypes.push(Syntax.Paragraph);
    }
    return nodeTypes;
};

/**
 * for each diff of changeSet
 * @param {ChangeSet} changeSet
 * @param {string} str
 * @param {function({
 matchStartIndex: number,
 matchEndIndex: number,
 actual: string
 expected: string
 })}onChangeOfMatch
 */
const forEachChange = (changeSet, str, onChangeOfMatch) => {
    const sortedDiffs = changeSet.diffs.sort(function (a, b) {
        return a.index - b.index;
    });
    let delta = 0;
    sortedDiffs.forEach(function (diff) {
        const result = diff.expected.replace(/\$([0-9]{1,2})/g, function (match, g1) {
            const index = parseInt(g1);
            if (index === 0 || diff.matches.length - 1 < index) {
                return match;
            }
            return diff.matches[index] || "";
        });
        // matchStartIndex/matchEndIndex value is original position, not replaced position
        // textlint use original position
        const matchStartIndex = diff.index;
        const matchEndIndex = matchStartIndex + diff.matches[0].length;
        // actual => expected
        const actual = str.slice(diff.index + delta, diff.index + delta + diff.matches[0].length);
        const prh = diff.rule.raw.prh || null;
        onChangeOfMatch({
            matchStartIndex,
            matchEndIndex,
            actual: actual,
            expected: result,
            prh
        });
        str = str.slice(0, diff.index + delta) + result + str.slice(diff.index + delta + diff.matches[0].length);
        delta += result.length - diff.matches[0].length;
    });
};
const getConfigBaseDir = (context) => {
    if (typeof context.getConfigBaseDir === "function") {
        return context.getConfigBaseDir() || process.cwd();
    }
    // Old fallback that use deprecated `config` value
    // https://github.com/textlint/textlint/issues/294
    const textlintRcFilePath = context.config ? context.config.configFile : null;
    // .textlintrc directory
    return textlintRcFilePath ? path.dirname(textlintRcFilePath) : process.cwd();
};

/**
 * [Markdown] get actual code value from CodeBlock node
 * @param {Object} node
 * @param {string} raw raw value include CodeBlock syntax
 * @returns {string}
 */
function getUntrimmedCode(node, raw) {
    if (node.type !== "CodeBlock") {
        return node.value;
    }
    // Space indented CodeBlock that has not lang
    if (!node.lang) {
        return node.value;
    }

    // If it is not markdown codeBlock, just use node.value
    if (!(raw.startsWith("```") && raw.endsWith("```"))) {
        if (node.value.endsWith("\n")) {
            return node.value;
        }
        return node.value + "\n";
    }
    // Markdown(remark) specific hack
    // https://github.com/wooorm/remark/issues/207#issuecomment-244620590
    const lines = raw.split("\n");
    // code lines without the first line and the last line
    const codeLines = lines.slice(1, lines.length - 1);
    // add last new line
    // \n```
    return codeLines.join("\n") + "\n";
}

function reporter(context, userOptions = {}) {
    assertOptions(userOptions);
    const options = Object.assign({}, defaultOptions, userOptions);
    // .textlintrc directory
    const textlintRCDir = getConfigBaseDir(context);
    // create prh config
    const rulePaths = options.rulePaths || [];
    const ruleContents = options.ruleContents || [];
    // yaml file + yaml contents
    const prhEngineContent = createPrhEngineFromContents(ruleContents);
    const prhEngineFiles = createPrhEngine(rulePaths, textlintRCDir);
    const prhEngine = mergePrh(prhEngineFiles, prhEngineContent);
    const helper = new RuleHelper(context);
    const { Syntax, getSource, report, fixer, RuleError } = context;
    const ignoreNodeTypes = createIgnoreNodeTypes(options, Syntax);
    const codeCommentTypes = options.checkCodeComment ? options.checkCodeComment : defaultOptions.checkCodeComment;
    const isDebug = options.debug ? options.debug : defaultOptions.debug;
    return {
        [Syntax.Str](node) {
            if (helper.isChildNode(node, ignoreNodeTypes)) {
                return;
            }
            const text = getSource(node);
            // to get position from index
            // https://github.com/prh/prh/issues/29
            const dummyFilePath = "";
            const makeChangeSet = prhEngine.makeChangeSet(dummyFilePath, text);
            forEachChange(makeChangeSet, text, ({ matchStartIndex, matchEndIndex, actual, expected, prh }) => {
                // If result is not changed, should not report
                if (actual === expected) {
                    return;
                }

                const suffix = prh !== null ? "\n" + prh : "";
                const messages = actual + " => " + expected + suffix;
                report(
                    node,
                    new RuleError(messages, {
                        index: matchStartIndex,
                        fix: fixer.replaceTextRange([matchStartIndex, matchEndIndex], expected)
                    })
                );
            });
        },
        [Syntax.CodeBlock](node) {
            const lang = node.lang;
            if (!lang) {
                return;
            }
            const checkLang = codeCommentTypes.some((type) => {
                return type === node.lang;
            });
            if (!checkLang) {
                return;
            }
            const rawText = getSource(node);
            const codeText = getUntrimmedCode(node, rawText);
            const sourceBlockDiffIndex = rawText !== node.value ? rawText.indexOf(codeText) : 0;
            const reportComment = (comment) => {
                // to get position from index
                // https://github.com/prh/prh/issues/29
                const dummyFilePath = "";
                // TODO: trim option for value?
                const text = comment.value;
                const makeChangeSet = prhEngine.makeChangeSet(dummyFilePath, text);
                forEachChange(makeChangeSet, text, ({ matchStartIndex, matchEndIndex, actual, expected, prh }) => {
                    // If result is not changed, should not report
                    if (actual === expected) {
                        return;
                    }

                    const suffix = prh !== null ? "\n" + prh : "";
                    const messages = actual + " => " + expected + suffix;
                    const commentIdentifier = comment.type === "CommentBlock" ? "/*" : "//";
                    const commentStart = sourceBlockDiffIndex + comment.start + commentIdentifier.length;
                    report(
                        node,
                        new RuleError(messages, {
                            index: commentStart + matchStartIndex,
                            fix: fixer.replaceTextRange(
                                [commentStart + matchStartIndex, commentStart + matchEndIndex],
                                expected
                            )
                        })
                    );
                });
            };
            try {
                const AST = parse(codeText, {
                    ranges: true,
                    allowReturnOutsideFunction: true,
                    allowAwaitOutsideFunction: true,
                    allowUndeclaredExports: true,
                    allowSuperOutsideMethod: true
                });
                const comments = AST.comments;
                if (!comments) {
                    return;
                }
                comments.forEach((comment) => {
                    reportComment(comment);
                });
            } catch (error) {
                if (isDebug) {
                    console.error(error);
                    report(node, new RuleError(error.message));
                }
            }
        }
    };
}

export default {
    linter: reporter,
    fixer: reporter
};
