import { assertOptions, createIgnoreNodeTypes, defaultOptions, forEachChange, getUntrimmedCode } from "./util";
import { RuleHelper } from "textlint-rule-helper";
import { parse } from "@babel/parser";
import { Engine } from "prh";

export function createReporter(prhEngineGenerator: (context, options) => Engine) {
    function reporter(context, userOptions: { rulePaths?: string[]; ruleContents?: string[] } = {}) {
        assertOptions(userOptions);
        const options = Object.assign({}, defaultOptions, userOptions);

        const prhEngine = prhEngineGenerator(context, options);

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
    return reporter;
}
