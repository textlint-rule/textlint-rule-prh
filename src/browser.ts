import { TextlintRuleContext } from "@textlint/types";
import { createReporter } from "./reporter";
import { createPrhEngineFromContents, mergePrh } from "./util";

export function createPrhEngineForBrowser(context: TextlintRuleContext, options) {
    // create prh config
    const ruleContents = options.ruleContents || [];
    // yaml file + yaml contents
    const prhEngineContent = createPrhEngineFromContents(ruleContents);

    const prhEngine = mergePrh(prhEngineContent);
    return prhEngine;
}

const reporter = createReporter(createPrhEngineForBrowser);

export default {
    linter: reporter,
    fixer: reporter
};
