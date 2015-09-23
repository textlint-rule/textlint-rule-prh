// LICENSE : MIT
"use strict";
import assert from "power-assert";
import {textlint} from "textlint";
import rule from "../src/prh-rule";
describe("prh-rule-test", function () {
    beforeEach(function () {
        textlint.setupRules({
            "prh": rule
        }, {
            "prh": {
                "rulePaths": [__dirname + "/fixtures/rule.yaml"]
            }
        });
    });
    afterEach(function () {
        textlint.resetRules();
    });
    context("when match word", function () {
        it("should report error", function () {
            var result = textlint.lintMarkdown("テストjquery");
            assert(result.messages.length > 0);
            assert(result.messages[0].line === 1);
            assert(result.messages[0].column === 4);
        });
    });
    context("when match word but s/Web/Web/i pattern", function () {
        // fix ignore (the) case
        it("should not report", function () {
            var result = textlint.lintMarkdown("jQuery");
            assert(result.messages.length === 0);
        });
    });
    context("when match word and s/ベンダ/ベンダー/ pattern", function () {
        // expected word contain actual word.
        // s/ベンダ/ベンダー/ のようにexpectedがpatternを包含している場合のexpectedを除外
        it("should not report", function () {
            var result = textlint.lintMarkdown("ベンダー");
            assert(result.messages.length === 0);
        });
    });
    context("when expected contain $1", function () {
        // expected word contain actual word.
        // s/ベンダ/ベンダー/ のようにexpectedがpatternを包含している場合のexpectedを除外
        it("should convert expected", function () {
            var result = textlint.lintMarkdown("広義のソフトウエアについて");
            assert(result.messages.length > 0);
            var message = result.messages[0].message;
            assert.equal(message, "のソフトウエア => のソフトウェア");
        });
    });

});
