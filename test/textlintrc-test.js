// LICENSE : MIT
"use strict";
import assert from "power-assert";
import {TextLintCore} from "textlint";
import rule from "../src/prh-rule";
import path from "path";
describe(".textlinrc test", function () {
    context("when use .textlintrc", function () {
        it("should resolve path to rule.yaml", function () {
            var textlint = new TextLintCore();
            textlint.setupRules({
                "prh": rule
            }, {
                "prh": {
                    "rulePaths": [path.join(__dirname, "fixtures", "rule.yaml")]
                }
            });
            var result = textlint.lintMarkdown("jquery");
            assert(result.messages.length === 1);
            assert(result.messages[0].line === 1);
            assert(result.messages[0].column === 1);
        });
        it("should resolve path to rule.yaml", function () {
            var textlint = new TextLintCore();
            textlint.setupRules({
                "prh": rule
            }, {
                "prh": {
                    "rulePaths": [path.join(__dirname, "fixtures", "rule.yaml")]
                }
            });
            var result = textlint.lintMarkdown("jquery");
            assert(result.messages.length === 1);
            assert(result.messages[0].line === 1);
            assert(result.messages[0].column === 1);
        });
    });
    context("prh features", function () {
        describe("import", function () {
            it("should work import directive", function () {
                var textlint = new TextLintCore();
                textlint.setupRules({
                    "prh": rule
                }, {
                    "prh": {
                        "rulePaths": [path.join(__dirname, "fixtures", "imports.yml")]
                    }
                });
                var result = textlint.lintMarkdown("A");
                assert(result.messages.length === 1);
                var message = result.messages[0].message;
                assert.equal(message, "A => a");
                var resultB = textlint.lintMarkdown("B");
                assert(resultB.messages.length === 1);
                var messageB = resultB.messages[0].message;
                assert.equal(messageB, "B => b");
            });
        });
    });
});
