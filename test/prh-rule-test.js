// LICENSE : MIT
"use strict";
import rule from "../src/textlint-rule-prh";
import TextLintTester from "textlint-tester";

const tester = new TextLintTester();
tester.run(
    "prh-rule",
    {
        rules: [
            {
                ruleId: "prh",
                rule,
                options: {
                    rulePaths: [__dirname + "/fixtures/rule.yaml"]
                }
            }
        ]
    },
    {
        invalid: [
            {
                description: "when match word",
                text: "テストjquery",
                errors: [{ message: "jquery => jQuery" }]
            },
            {
                description: "when match word and s/） /）/ pattern",
                text: "THIS（図1） 。",
                errors: [{ message: "）  => ）" }]
            },
            {
                description: "when expected contain $1",
                text: "広義のソフトウエアについて",
                output: "広義のソフトウェアについて",
                errors: [{ message: "のソフトウエア => のソフトウェア" }]
            }
        ],
        valid: [
            {
                description: "when match word but s/Web/Web/i pattern",
                text: "jQuery"
            },
            {
                description: "when match word and s/ベンダ/ベンダー/ pattern",
                text: "ベンダー"
            }
        ]
    }
);
