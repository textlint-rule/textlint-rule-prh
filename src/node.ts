// LICENSE : MIT
import { homedir } from "node:os";
import { Engine, fromYAML, fromYAMLFilePath } from "prh";
import { resolve, dirname } from "path";
import { createReporter } from "./core";
import { TextlintRuleContext, TextlintRuleReporter } from "@textlint/types";

const homeDirectory = homedir();

const untildify = (filePath: string): string => {
    return homeDirectory ? filePath.replace(/^~(?=$|\/|\\)/, homeDirectory) : filePath;
};

function createPrhEngine(rulePaths: string[], baseDir: string): Engine | null {
    if (rulePaths.length === 0) {
        return null;
    }
    const expandedRulePaths = rulePaths.map((rulePath) => untildify(rulePath));
    const prhEngine = fromYAMLFilePath(resolve(baseDir, expandedRulePaths[0]));
    expandedRulePaths.slice(1).forEach((ruleFilePath) => {
        const config = fromYAMLFilePath(resolve(baseDir, ruleFilePath));
        prhEngine.merge(config);
    });
    return prhEngine;
}

function createPrhEngineFromContents(yamlContents: string[]) {
    if (yamlContents.length === 0) {
        return null;
    }
    const dummyFilePath = "";
    const prhEngine = fromYAML(dummyFilePath, yamlContents[0]);
    yamlContents.slice(1).forEach((content) => {
        const config = fromYAML(dummyFilePath, content);
        prhEngine.merge(config);
    });
    return prhEngine;
}

function mergePrh(...engines: (Engine | null)[]) {
    const engines_ = engines.filter((engine) => !!engine);
    const mainEngine = engines_[0];
    engines_.slice(1).forEach((engine) => {
        mainEngine.merge(engine);
    });
    return mainEngine;
}

const getConfigBaseDir = (context: TextlintRuleContext) => {
    if (typeof context.getConfigBaseDir === "function") {
        return context.getConfigBaseDir() || process.cwd();
    }
    // @ts-expect-error Old fallback that use deprecated `config` value
    // https://github.com/textlint/textlint/issues/294
    const textlintRcFilePath = context.config ? context.config.configFile : null;
    // .textlintrc directory
    return textlintRcFilePath ? dirname(textlintRcFilePath) : process.cwd();
};

const reporter: TextlintRuleReporter = createReporter((context, options) => {
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
});

export default {
    linter: reporter,
    fixer: reporter
};
