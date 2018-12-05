const babelParser = require("@babel/core");
const babelTraverse = require("@babel/traverse");
const babelGenerator = require('@babel/generator');
const fs = require("fs");
const unbend = require('unbend')



const JSXTEXT_TYPE = 'JSXText';

function modifyAbstractSyntaxTree(extractedStringsWithKeyAndPath, parsedTree) {
    for (let [_, obj] of Object.entries(extractedStringsWithKeyAndPath)) {
        babelTraverse.default(parsedTree, {
            enter(path) {
                if (path.type === JSXTEXT_TYPE && exports.cleanUpExtractedString(path.node.value) === obj.value) {
                    path.node.value = `{I18n.t("${obj.key}")}`;
                }
            }
        })
    }
}

function writeToFile(jsFileName, newFileContent) {
    fs.writeFileSync(jsFileName, newFileContent.code);
}

exports.replaceJsxStringsWithKeys = (fileContent, jsFileName, jsonFileName) => {
    let extractedStrings = exports.extractStrings(fileContent);
    let extractedStringsWithKeyAndPath = exports.writeToJsonFile(jsonFileName, jsFileName, extractedStrings);
    let parsedTree = getParsedTree(fileContent);

    modifyAbstractSyntaxTree(extractedStringsWithKeyAndPath, parsedTree);

    let newFileContent = babelGenerator.default(parsedTree,{sourceMap: true}, fileContent);
    writeToFile(jsFileName, newFileContent);
    return newFileContent.code;
};

function getJsonDictObject(jsonFileName) {
    let fileContent = exports.readJsFileContent(jsonFileName);
    return JSON.parse(fileContent);
}

function getStringKey(fileName, extractedStrings, index) {
    return `${fileName.replace('.js', '')}.${extractedStrings[index].type}.index(${index})`;
}

function getStringValue(extractedStrings, index) {
    return `${extractedStrings[index].value}`;
}

function insertNewEntryInJsonObject(fileName, extractedStrings, index, jsonFileContent, extractedStringsWithKeyAndPath) {
    let stringKey = getStringKey(fileName, extractedStrings, index);
    let stringValue = getStringValue(extractedStrings, index);

    jsonFileContent[stringKey] = stringValue;

    extractedStringsWithKeyAndPath.push({
        key: stringKey,
        path: extractedStrings[index].path,
        value: stringValue
    });
}

function writeToJsonFileWithIndentation(jsonFileName, jsonFileContent) {
    fs.writeFileSync(jsonFileName, JSON.stringify(jsonFileContent, null, 4));
}

exports.writeToJsonFile = (jsonFileName, jsFileName, extractedStrings) => {
    let extractedStringsWithKeyAndPath = [];
    let jsonFileContent = getJsonDictObject(jsonFileName);

    for (let index = 0; index < extractedStrings.length; index += 1) {
        insertNewEntryInJsonObject(jsFileName, extractedStrings, index, jsonFileContent, extractedStringsWithKeyAndPath);
    }

    writeToJsonFileWithIndentation(jsonFileName, jsonFileContent);
    return extractedStringsWithKeyAndPath;
};

exports.readJsFileContent = jsFileName => {
    return fs.readFileSync(jsFileName, 'utf8');
};

exports.cleanUpExtractedString = extractedString => {
    return extractedString.replace(/[\t\n]+/gm, ' ').trim();
};

function getParsedTree(jsFileContent) {
    return babelParser.parse(jsFileContent, {
        presets: ["@babel/preset-react"],
        plugins: ["@babel/plugin-proposal-class-properties"]
    });
}

function getFlatParseTree(jsFileContent) {
    let parserTree = getParsedTree(jsFileContent);
    let flatParseTree = unbend(parserTree, {separator: '.', skipFirstSeparator: true, parseArray: true});
    return flatParseTree;
}

function getAllStringsWithTypeAndPath(flatParseTree) {
    let extractedStringsWithTypeAndPath = [];
    for (let [key, value] of Object.entries(flatParseTree)) {
        if (value === JSXTEXT_TYPE) {
            let textKey = key.replace("type", "value");
            let extractedText = flatParseTree[textKey];
            extractedText = exports.cleanUpExtractedString(extractedText);
            if (extractedText.length !== 0) {
                extractedStringsWithTypeAndPath.push({
                    path: textKey.replace('.value', ''),
                    type: JSXTEXT_TYPE,
                    value: extractedText
                });
            }
        }
    }
    return extractedStringsWithTypeAndPath;
}

exports.extractStrings = jsFileContent => {
    let flatParseTree = getFlatParseTree(jsFileContent);
    return getAllStringsWithTypeAndPath(flatParseTree);
};
