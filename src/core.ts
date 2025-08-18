// LICENSE : MIT
import { RuleHelper } from "textlint-rule-helper";
import { parse } from "@babel/parser";
import { ChangeSet, Engine } from "prh";
import {
    TextlintRuleContext,
    TextlintRuleOptions,
    TextlintRuleReporter,
    TextlintRuleReportHandler
} from "@textlint/types";
import { ASTNodeTypes, TxtCodeBlockNode } from "@textlint/ast-node-types";
import { CommentBlock, CommentLine } from "@babel/types";

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

const assertOptions = (options: TextlintRuleOptions) => {
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

const createIgnoreNodeTypes = (options: TextlintRuleOptions, Syntax: typeof ASTNodeTypes) => {
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
 */
const forEachChange = (
    changeSet: ChangeSet,
    str: string,
    onChangeOfMatch: (arg: {
        matchStartIndex: number;
        matchEndIndex: number;
        actual: string;
        expected: string;
        prh?: string;
    }) => void
) => {
    const sortedDiffs = changeSet.diffs.sort(function (a, b) {
        return a.index - b.index;
    });
    let delta = 0;
    sortedDiffs.forEach(function (diff) {
        // TODO: What should I use `!` or `?`
        const result = diff.expected!.replace(/\$([0-9]{1,2})/g, function (match, g1) {
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
        // TODO: What should I use `!` or `?`
        const prh = diff.rule!.raw.prh || null;
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

/**
 * [Markdown] get actual code value from CodeBlock node
 * @param node
 * @param raw raw value include CodeBlock syntax
 */
function getUntrimmedCode(node: TxtCodeBlockNode, raw: string): string {
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

export function createReporter(
    createPrhEngine: (context: TextlintRuleContext, options: TextlintRuleOptions) => Engine
): TextlintRuleReporter {
    function reporter(context: TextlintRuleContext, userOptions: TextlintRuleOptions = {}): TextlintRuleReportHandler {
        assertOptions(userOptions);
        const options = Object.assign({}, defaultOptions, userOptions);

        const prhEngine = createPrhEngine(context, options);

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
                const reportComment = (comment: CommentBlock | CommentLine) => {
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
                        // TODO: What should I use `!` or `?`
                        const commentStart = sourceBlockDiffIndex + comment.start! + commentIdentifier.length;
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
                        //@ts-expect-error
                        report(node, new RuleError(error.message));
                    }
                }
            }
        };
    }
    return reporter;
}
