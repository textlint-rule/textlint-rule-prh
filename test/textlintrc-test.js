// LICENSE : MIT
"use strict";
import assert from "assert";
import fs from "fs";
import { TextLintEngine, TextLintCore } from "textlint";
import rule from "../src/textlint-rule-prh";
import path from "path";

describe(".textlinrc test", function() {
    context("when use .textlintrc", function() {
        it("should resolve path to rule.yaml", function() {
            const engine = new TextLintEngine({
                configFile: path.join(__dirname, "fixtures/.textlintrc"),
                rulesBaseDirectory: path.join(__dirname, "../src")
            });
            return engine.executeOnText("jquery").then(([result]) => {
                assert(result.messages.length === 1);
                assert(result.messages[0].line === 1);
                assert(result.messages[0].column === 1);
            });
        });
    });
    context("options", () => {
        it("should resolve path to rule.yaml", function() {
            var textlint = new TextLintCore();
            textlint.setupRules(
                {
                    prh: rule
                },
                {
                    prh: {
                        rulePaths: [path.join(__dirname, "fixtures", "rule.yaml")]
                    }
                }
            );
            return textlint.lintMarkdown("jquery").then(result => {
                assert(result.messages.length === 1);
                assert(result.messages[0].line === 1);
                assert(result.messages[0].column === 1);
            });
        });
        it("should resolve yaml content", function() {
            var textlint = new TextLintCore();
            var content = fs.readFileSync(path.join(__dirname, "fixtures", "rule.yaml"), "utf-8");
            textlint.setupRules(
                {
                    prh: rule
                },
                {
                    prh: {
                        ruleContents: [content]
                    }
                }
            );
            return textlint.lintMarkdown("jquery").then(result => {
                assert(result.messages.length === 1);
                assert(result.messages[0].line === 1);
                assert(result.messages[0].column === 1);
            });
        });
        it("should resolve yaml file and content", function() {
            var textlint = new TextLintCore();
            var content = fs.readFileSync(path.join(__dirname, "fixtures", "rule.yaml"), "utf-8");
            textlint.setupRules(
                {
                    prh: rule
                },
                {
                    prh: {
                        // path support prh's `imports` feature
                        rulePaths: [path.join(__dirname, "fixtures", "imports.yml")],
                        // content doesn't support `import`
                        ruleContents: [content]
                    }
                }
            );
            return textlint.lintMarkdown("jquery A").then(result => {
                assert(result.messages.length === 2);
                assert(result.messages[0].line === 1);
                assert(result.messages[0].column === 1);
                assert(result.messages[1].line === 1);
                assert(result.messages[1].column === 8);
            });
        });
    });

    context("prh features", function() {
        describe("import", function() {
            it("should work import directive", function() {
                var textlint = new TextLintCore();
                textlint.setupRules(
                    {
                        prh: rule
                    },
                    {
                        prh: {
                            rulePaths: [path.join(__dirname, "fixtures", "imports.yml")]
                        }
                    }
                );
                return textlint
                    .lintMarkdown("A")
                    .then(result => {
                        assert(result.messages.length === 1);
                        var message = result.messages[0].message;
                        assert.equal(message, "A => a");
                    })
                    .then(() => {
                        return textlint.lintMarkdown("B").then(result => {
                            assert(result.messages.length === 1);
                            var messageB = result.messages[0].message;
                            assert.equal(messageB, "B => b");
                        });
                    });
            });
        });
    });
});
