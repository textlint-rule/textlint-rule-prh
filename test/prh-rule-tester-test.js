import TextLintTester from "textlint-tester";
// rule
import rule from "../src/textlint-rule-prh";
const tester = new TextLintTester();
// ruleName, rule, { valid, invalid }
const CODE_START_JS = "```js";
const CODE_END = "```";
tester.run("prh", rule, {
    valid: [
        {
            text: "JavaScript library",
            options: {
                rulePaths: [__dirname + "/fixtures/rule.yaml"]
            }
        },
        {
            text: "[jquery](jquery)\n> ＪＱＵＥＲＹ\n\n*ディフォルト*",
            options: {
                rulePaths: [__dirname + "/fixtures/rule.yaml"]
            }
        },
        {
            text: "# ディフォルト設定",
            options: {
                rulePaths: [__dirname + "/fixtures/rule.yaml"],
                checkHeader: false
            }
        },
        {
            text: "ディフォルト設定",
            options: {
                rulePaths: [__dirname + "/fixtures/rule.yaml"],
                checkParagraph: false
            }
        },
        {
            text: `${CODE_START_JS}\n" + "\n" + "\n" + "// JavaScript\n" + "var a = 1;\n${CODE_END}`,
            options: {
                checkCodeComment: ["js"],
                rulePaths: [__dirname + "/fixtures/rule.yaml"]
            }
        },
        {
            text: `${CODE_START_JS}// jquery is wrong, but this check is not by default\n${CODE_END}`,
            options: {
                checkCodeComment: [],
                rulePaths: [__dirname + "/fixtures/rule.yaml"]
            }
        },
        // empty code block
        {
            text: `${CODE_START_JS}${CODE_END}`,
            options: {
                checkCodeComment: ["js"],
                rulePaths: [__dirname + "/fixtures/rule.yaml"]
            }
        },
        // The CodeBlock includes invalid syntax, it is just ignored
        {
            text: `${CODE_START_JS}
+++++++
// jquery
${CODE_START_JS}`,
            options: {
                checkCodeComment: ["js"],
                rulePaths: [__dirname + "/fixtures/rule.yaml"]
            }
        }
    ],
    invalid: [
        {
            text: "cookie is a data.\n" + "texlint check your texts.\n" + "jquery is libray.\n",
            output: "Cookie is a data.\n" + "texlint check your texts.\n" + "jQuery is libray.\n",
            options: {
                rulePaths: [__dirname + "/fixtures/rule.yaml"]
            },
            errors: [
                {
                    message: "cookie => Cookie",
                    line: 1,
                    column: 1
                },
                {
                    message: "jquery => jQuery",
                    line: 3,
                    column: 1
                }
            ]
        },
        {
            text: "行う、行なう、おこなう。行って、行わない、行ないます。",
            output: "おこなう、おこなう、おこなう。おこなって、おこなわない、おこないます。",
            options: {
                rulePaths: [__dirname + "/fixtures/prefer-regexp.yml"]
            },
            errors: [
                {
                    type: "lint",
                    ruleId: "prh",
                    message: "行 => おこな\n「行う」「行なう」は開く。",
                    index: 0,
                    line: 1,
                    column: 1,
                    severity: 2,
                    fix: {
                        range: [0, 1],
                        text: "おこな"
                    }
                },
                {
                    type: "lint",
                    ruleId: "prh",
                    message: "行な => おこな\n「行う」「行なう」は開く。",
                    index: 3,
                    line: 1,
                    column: 4,
                    severity: 2,
                    fix: {
                        range: [3, 5],
                        text: "おこな"
                    }
                },
                {
                    type: "lint",
                    ruleId: "prh",
                    message: "行 => おこな\n「行う」「行なう」は開く。",
                    index: 12,
                    line: 1,
                    column: 13,
                    severity: 2,
                    fix: {
                        range: [12, 13],
                        text: "おこな"
                    }
                },
                {
                    type: "lint",
                    ruleId: "prh",
                    message: "行 => おこな\n「行う」「行なう」は開く。",
                    index: 16,
                    line: 1,
                    column: 17,
                    severity: 2,
                    fix: {
                        range: [16, 17],
                        text: "おこな"
                    }
                },
                {
                    type: "lint",
                    ruleId: "prh",
                    message: "行な => おこな\n「行う」「行なう」は開く。",
                    index: 21,
                    line: 1,
                    column: 22,
                    severity: 2,
                    fix: {
                        range: [21, 23],
                        text: "おこな"
                    }
                }
            ]
        },
        {
            text: "[jquery](https://example.com)",
            output: "[jQuery](https://example.com)",
            options: {
                rulePaths: [__dirname + "/fixtures/rule.yaml"],
                checkLink: true
            },
            errors: [
                {
                    type: "lint",
                    ruleId: "prh",
                    message: "jquery => jQuery",
                    index: 1,
                    line: 1,
                    column: 2,
                    severity: 2,
                    fix: {
                        range: [1, 7],
                        text: "jQuery"
                    }
                }
            ]
        },
        {
            text: "> ＪＱＵＥＲＹ",
            output: "> jQuery",
            options: {
                rulePaths: [__dirname + "/fixtures/rule.yaml"],
                checkBlockQuote: true
            },
            errors: [
                {
                    type: "lint",
                    ruleId: "prh",
                    message: "ＪＱＵＥＲＹ => jQuery",
                    index: 2,
                    line: 1,
                    column: 3,
                    severity: 2,
                    fix: {
                        range: [2, 8],
                        text: "jQuery"
                    }
                }
            ]
        },
        {
            text: "*ディフォルト*",
            output: "*デフォルト*",
            options: {
                rulePaths: [__dirname + "/fixtures/rule.yaml"],
                checkEmphasis: true
            },
            errors: [
                {
                    type: "lint",
                    ruleId: "prh",
                    message: "ディフォルト => デフォルト\n表記をデフォルトに統一してください",
                    index: 1,
                    line: 1,
                    column: 2,
                    severity: 2,
                    fix: {
                        range: [1, 7],
                        text: "デフォルト"
                    }
                }
            ]
        },
        {
            text: "# ディフォルト設定",
            output: "# デフォルト設定",
            options: {
                rulePaths: [__dirname + "/fixtures/rule.yaml"]
            },
            errors: [
                {
                    type: "lint",
                    ruleId: "prh",
                    message: "ディフォルト => デフォルト\n表記をデフォルトに統一してください",
                    index: 2,
                    line: 1,
                    column: 3,
                    severity: 2,
                    fix: {
                        range: [2, 8],
                        text: "デフォルト"
                    }
                }
            ]
        },
        {
            text: "ディフォルト設定",
            output: "デフォルト設定",
            options: {
                rulePaths: [__dirname + "/fixtures/rule.yaml"]
            },
            errors: [
                {
                    type: "lint",
                    ruleId: "prh",
                    message: "ディフォルト => デフォルト\n表記をデフォルトに統一してください",
                    index: 0,
                    line: 1,
                    column: 1,
                    severity: 2,
                    fix: {
                        range: [0, 6],
                        text: "デフォルト"
                    }
                }
            ]
        },
        // comment
        {
            text: `${CODE_START_JS}
// $ is jquery
const $ = jquery;
${CODE_END}`,
            output: `${CODE_START_JS}
// $ is jQuery
const $ = jquery;
${CODE_END}`,
            errors: [
                {
                    index: 14,
                    message: "jquery => jQuery"
                }
            ],
            options: {
                checkCodeComment: ["js"],
                rulePaths: [__dirname + "/fixtures/rule.yaml"]
            }
        },
        // BlockComment
        {
            text: `${CODE_START_JS}
/**
 * $ is jquery
 **/
const $ = jquery;
${CODE_END}`,
            output: `${CODE_START_JS}
/**
 * $ is jQuery
 **/
const $ = jquery;
${CODE_END}`,
            errors: [
                {
                    index: 18,
                    message: "jquery => jQuery"
                }
            ],
            options: {
                checkCodeComment: ["js"],
                rulePaths: [__dirname + "/fixtures/rule.yaml"]
            }
        },
        // BlockComment multiple
        {
            text:
                "```javascript\n" +
                "/**\n" +
                " * $ is jquery\n" +
                " **/" +
                "/**\n" +
                " * cookie is Cookie\n" +
                " **/\n" +
                "```",
            output:
                "```javascript\n" +
                "/**\n" +
                " * $ is jQuery\n" +
                " **/" +
                "/**\n" +
                " * Cookie is Cookie\n" +
                " **/\n" +
                "```",
            errors: [
                {
                    index: 26,
                    message: "jquery => jQuery"
                },
                {
                    index: 44,
                    message: "cookie => Cookie"
                }
            ],
            options: {
                checkCodeComment: ["javascript"],
                rulePaths: [__dirname + "/fixtures/rule.yaml"]
            }
        },
        // example-prh.yml
        {
            text: "jqueryではクッキー。ディフォルトとハードウエアー。(そのとおり)\nサーバはサーバーサイドをjsする。",
            output: "jQueryではクッキー。デフォルトとハードウェア。（そのとおり）\nサーバーはサーバーサイドをjsする。",
            options: {
                rulePaths: [__dirname + "/fixtures/example-prh.yml"]
            },
            errors: [
                {
                    type: "lint",
                    ruleId: "prh",
                    message: "jquery => jQuery",
                    index: 0,
                    line: 1,
                    column: 1,
                    severity: 2,
                    fix: {
                        range: [0, 6],
                        text: "jQuery"
                    }
                },
                {
                    type: "lint",
                    ruleId: "prh",
                    message: "ディフォルト => デフォルト",
                    index: 13,
                    line: 1,
                    column: 14,
                    severity: 2,
                    fix: {
                        range: [13, 19],
                        text: "デフォルト"
                    }
                },
                {
                    type: "lint",
                    ruleId: "prh",
                    message: "ハードウエアー => ハードウェア",
                    index: 20,
                    line: 1,
                    column: 21,
                    severity: 2,
                    fix: {
                        range: [20, 27],
                        text: "ハードウェア"
                    }
                },
                {
                    type: "lint",
                    ruleId: "prh",
                    message: "(そのとおり) => （そのとおり）",
                    index: 28,
                    line: 1,
                    column: 29,
                    severity: 2,
                    fix: {
                        range: [28, 35],
                        text: "（そのとおり）"
                    }
                },
                {
                    type: "lint",
                    ruleId: "prh",
                    message: "サーバ => サーバー",
                    index: 36,
                    line: 2,
                    column: 1,
                    severity: 2,
                    fix: {
                        range: [36, 39],
                        text: "サーバー"
                    }
                }
            ]
        }
    ]
});
