import * as path from "node:path";
import * as os from "node:os";
import { fromYAMLFilePath } from "prh";
import { createPrhEngineFromContents, mergePrh } from "./util";
import { createReporter } from "./reporter";

import { TextlintRuleContext } from "@textlint/types";

const homeDirectory = os.homedir();

const untildify = (filePath) => {
    return homeDirectory ? filePath.replace(/^~(?=$|\/|\\)/, homeDirectory) : filePath;
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

const getConfigBaseDir = (context: TextlintRuleContext) => {
    if (typeof context.getConfigBaseDir === "function") {
        return context.getConfigBaseDir() || process.cwd();
    }
    // Old fallback that use deprecated `config` value
    // https://github.com/textlint/textlint/issues/294
    //@ts-expect-error
    const textlintRcFilePath = context.config ? context.config.configFile : null;
    // .textlintrc directory
    return textlintRcFilePath ? path.dirname(textlintRcFilePath) : process.cwd();
};

export function createPrhEngineForNode(context: TextlintRuleContext, options) {
    // .textlintrc directory
    const textlintRCDir = getConfigBaseDir(context);

    // create prh config
    const rulePaths = options.rulePaths || [];
    const ruleContents = options.ruleContents || [];
    // yaml file + yaml contents
    const prhEngineContent = createPrhEngineFromContents(ruleContents);
    const prhEngineFiles = createPrhEngine(rulePaths, textlintRCDir);

    const prhEngine = mergePrh(prhEngineFiles, prhEngineContent);
    return prhEngine;
}

const reporter = createReporter(createPrhEngineForNode);

export default {
    linter: reporter,
    fixer: reporter
};
