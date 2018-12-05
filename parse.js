const babelParser = require("@babel/core");
const babelTraverse = require("@babel/traverse");
const babelGenerator = require('@babel/generator');
const fs = require("fs");
const unbend = require('unbend')

exports.replaceJsxStringsWithKeys = (fileContent, jsFileName, jsonFileName) => {
    let extractedStrings = exports.extractStrings(fileContent);
    let keysAndPathsOfExtractedStrings = exports.writeToJsonFile(jsonFileName, jsFileName, extractedStrings);
    let parsedTree = getParsedTree(fileContent);

    for (let [_, obj] of Object.entries(keysAndPathsOfExtractedStrings)) {
        babelTraverse.default(parsedTree, {
            enter(path) {
                if(path.type === 'JSXText' && exports.cleanUpExtractedString(path.node.value) === obj.value) {
                    path.node.value = `{I18n.t("${obj.key}")}`;
                }
            }
        })
    }

    let newFileContent = babelGenerator.default(parsedTree,{sourceMap: true}, fileContent);
    fs.writeFileSync(jsFileName, newFileContent.code);
    return newFileContent.code;
};

function getJsonDictObject(jsonFileName) {
    let fileContent = exports.readJsFileContent(jsonFileName);
    let jsonFileContent = JSON.parse(fileContent);
    return jsonFileContent;
}

function insertNewEntryInJsonObject(fileName, extractedStrings, index, jsonFileContent, keysAndPathsOfExtractedStrings) {
    let stringKey = `${fileName.replace('.js','')}.${extractedStrings[index].type}.index(${index})`;
    let stringValue = `${extractedStrings[index].value}`;
    jsonFileContent[stringKey] = stringValue;
    keysAndPathsOfExtractedStrings.push({
        key: stringKey,
        path: extractedStrings[index].path,
        value: stringValue
    });
}

function writeToJsonFileWithIndentation(jsonFileName, jsonFileContent) {
    fs.writeFileSync(jsonFileName, JSON.stringify(jsonFileContent, null, 4));
}

exports.writeToJsonFile = (jsonFileName, jsFileName, extractedStrings) => {
    let keysAndPathsOfExtractedStrings = [];
    let jsonFileContent = getJsonDictObject(jsonFileName);

    for (let index = 0; index < extractedStrings.length; index += 1) {
        insertNewEntryInJsonObject(jsFileName, extractedStrings, index, jsonFileContent, keysAndPathsOfExtractedStrings);
    }

    writeToJsonFileWithIndentation(jsonFileName, jsonFileContent);
    return keysAndPathsOfExtractedStrings;
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

function getAllTextComponentsValues(flatParseTree) {
    let extractedStrings = [];
    for (let [key, value] of Object.entries(flatParseTree)) {
        if (value === "JSXText") {
            let textKey = key.replace("type", "value");
            let extractedText = flatParseTree[textKey];
            extractedText = exports.cleanUpExtractedString(extractedText);
            if (extractedText.length !== 0) {
                extractedStrings.push({
                    path: textKey.replace('.value', ''),
                    type: 'JSXText',
                    value: extractedText
                });
            }
        }
    }
    return extractedStrings;
}

exports.extractStrings = jsFileContent => {
    let flatParseTree = getFlatParseTree(jsFileContent);
    return getAllTextComponentsValues(flatParseTree);
};


// function treeTaverseRecursive(treeJsonObject)
// {
//     for (let node in treeJsonObject)
//     {
//         if (typeof treeJsonObject[node] == "object" && treeJsonObject[node] !== null) {
//             treeTaverseRecursive(treeJsonObject[node]);
//         }
//         // do something...
//     }
// }
// let filePath = "/Users/omar/Desktop/Work/shapa-react-native/src/components/missions/ActiveMission.js";
//
// let code = fs.readFileSync(filePath, 'utf8');
// let parserOutput = babelParser.parse(code, {
//     presets: ["@babel/preset-react"],
//     plugins: ["@babel/plugin-proposal-class-properties"]
// });
// console.log(JSON.stringify(parserOutput));
