// LICENSE : MIT
"use strict";
import assert from "power-assert";
import { textlint } from "textlint";
import rule from "../src/textlint-rule-prh";
describe("prh-rule-test", function() {
    beforeEach(function() {
        textlint.setupRules(
            {
                prh: rule
            },
            {
                prh: {
                    rulePaths: [__dirname + "/fixtures/rule.yaml"]
                }
            }
        );
    });
    afterEach(function() {
        textlint.resetRules();
    });
    context("when match word", function() {
        it("should report error", function() {
            return textlint.lintMarkdown("テストjquery").then(result => {
                assert(result.messages.length > 0);
                assert(result.messages[0].line === 1);
                assert(result.messages[0].column === 4);
            });
        });
    });
    context("when match word and s/） /）/ pattern", function() {
        it("should report error", function() {
            return textlint.lintMarkdown("（図1） ").then(result => {
                assert(result.messages.length > 0);
                assert(result.messages[0].line === 1);
                assert(result.messages[0].column === 4);
            });
        });
    });
    context("when match word but s/Web/Web/i pattern", function() {
        // fix ignore (the) case
        it("should not report", function() {
            return textlint.lintMarkdown("jQuery").then(result => {
                assert(result.messages.length === 0);
            });
        });
    });
    context("when match word and s/ベンダ/ベンダー/ pattern", function() {
        // expected word contain actual word.
        // s/ベンダ/ベンダー/ のようにexpectedがpatternを包含している場合のexpectedを除外
        it("should not report", function() {
            return textlint.lintMarkdown("ベンダー").then(result => {
                assert(result.messages.length === 0);
            });
        });
    });
    context("when expected contain $1", function() {
        // expected word contain actual word.
        // s/ベンダ/ベンダー/ のようにexpectedがpatternを包含している場合のexpectedを除外
        it("should convert expected", function() {
            return textlint.lintMarkdown("広義のソフトウエアについて").then(result => {
                assert(result.messages.length > 0);
                var message = result.messages[0].message;
                assert.equal(message, "のソフトウエア => のソフトウェア");
            });
        });
    });
    context("when fixer", function() {
        // expected word contain actual word.
        // s/ベンダ/ベンダー/ のようにexpectedがpatternを包含している場合のexpectedを除外
        it("should convert expected", function() {
            return textlint.fixText("広義のソフトウエアについて", ".md").then(({ output }) => {
                assert.equal(output, "広義のソフトウェアについて");
            });
        });
    });
});
