const babelParser = require("@babel/core");
const babelTraverse = require("@babel/traverse");
const babelGenerator = require('@babel/generator');
const fs = require("fs");
const unbend = require('unbend');


const JSX_TEXT_TYPE = 'JSXText';
const JSX_EXPERESSION_TYPE = 'JSXExpressionContainer';
const JSX_ATTRIBUTE_TYPE = 'JSXAttribute';

const modifyAbstractSyntaxTree = (extractedStringsWithKeyAndPath, parsedTree, stringType) => {
    for (let [_, obj] of Object.entries(extractedStringsWithKeyAndPath)) {
        babelTraverse.default(parsedTree, {
            JSXText(path) {
                if (exports.cleanUpExtractedString(path.node.value) === obj.value) {
                    path.node.value = `{I18n.t("${obj.key}")}`;
                    return;
                }
            },
            JSXExpressionContainer(path) {
                path.traverse({
                    StringLiteral(path) {
                        if (exports.cleanUpExtractedString(path.node.value) === obj.value) {
                            path.node.extra.raw = `I18n.t("${obj.key}")`;
                            return;
                        }
                    }
                });
            },
            JSXOpeningElement(path) {
                path.traverse({
                    JSXAttribute(path) {
                        if (path.name === 'title') {
                            path.traverse({
                                StringLiteral(path) {
                                    console.log(path);
                                }
                            })
                        }
                    }
                });
            }
        })
    }
};

const writeToFile = (jsFileName, newFileContent) => {
    fs.writeFileSync('output/' + jsFileName, newFileContent.code);
};

exports.replaceStringsWithKeys = (fileContent, jsFileName, jsonFileName, stringType) => {
    let extractedStrings = exports.extractStrings(fileContent, stringType);
    let extractedStringsWithKeyAndPath = exports.writeToJsonFile(jsonFileName, jsFileName, extractedStrings);
    let parsedTree = getParsedTree(fileContent);

    modifyAbstractSyntaxTree(extractedStringsWithKeyAndPath, parsedTree, stringType);

    let newFileContent = babelGenerator.default(parsedTree, {sourceMap: true}, fileContent);
    writeToFile(jsFileName, newFileContent);
    return newFileContent.code;
};


const getJsonDictObject = jsonFileName => {
    let fileContent = exports.readJsFileContent(jsonFileName);
    return JSON.parse(fileContent);
};

const getStringKey = (fileName, extractedStrings, index, typeCount) => {
    return `${fileName.replace('.js', '')}.${extractedStrings[index].type}.index(${typeCount - 1})`;
};

const getStringValue = (extractedStrings, index) => {
    return `${extractedStrings[index].value}`;
};

const insertNewEntryInJsonObject = (fileName, extractedStrings, index, jsonFileContent, extractedStringsWithKeyAndPath, typeCount) => {
    let stringKey = getStringKey(fileName, extractedStrings, index, typeCount);
    let stringValue = getStringValue(extractedStrings, index);

    jsonFileContent[stringKey] = stringValue;

    extractedStringsWithKeyAndPath.push({
        key: stringKey,
        path: extractedStrings[index].path,
        value: stringValue
    });
};

writeToJsonFileWithIndentation = (jsonFileName, jsonFileContent) => {
    fs.writeFileSync(jsonFileName, JSON.stringify(jsonFileContent, null, 4));
};

exports.writeToJsonFile = (jsonFileName, jsFileName, extractedStrings) => {
    let extractedStringsWithKeyAndPath = [];
    let jsonFileContent = getJsonDictObject(jsonFileName);
    let jsxTypeCount = {};

    for (let index = 0; index < extractedStrings.length; index += 1) {
        if (extractedStrings[index].type in jsxTypeCount) {
            jsxTypeCount[extractedStrings[index].type] += 1;
        } else {
            jsxTypeCount[extractedStrings[index].type] = 1;
        }
        insertNewEntryInJsonObject(jsFileName, extractedStrings, index, jsonFileContent, extractedStringsWithKeyAndPath, jsxTypeCount[extractedStrings[index].type]);
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

const getParsedTree = jsFileContent => {
    return babelParser.parse(jsFileContent, {
        presets: ["@babel/preset-react"],
        plugins: ["@babel/plugin-proposal-class-properties"]
    });
};

const getFlatParseTree = jsFileContent => {
    let parserTree = getParsedTree(jsFileContent);
    fs.writeFileSync('output-tree.json', JSON.stringify(parserTree));
    let flatParseTree = unbend(parserTree, {separator: '.', skipFirstSeparator: true, parseArray: true});
    fs.writeFileSync('output.json', JSON.stringify(flatParseTree));
    return flatParseTree;
};

const constructStringObject = (textKey, extractedText, stringType) => {
    return {
        path: textKey.replace('.value', ''),
        type: stringType,
        value: extractedText
    };
};

const modifyNodeKeyAndGetNodeValue = (key, originalPath, replacementPath, flatParseTree) => {
    let textKey = key.replace(originalPath, replacementPath);
    let extractedText = flatParseTree[textKey];
    return {textKey, extractedText};
};

const getAllJSXStringsWithTypeAndPath = (flatParseTree, jsFileContent) => {
    let extractedStringsWithTypeAndPath = [];

    let parsedTree = getParsedTree(jsFileContent);
    babelTraverse.default(parsedTree, {
            JSXText(path) {
                if (exports.cleanUpExtractedString(path.node.value).length !== 0) {
                    let nodePath = path.getPathLocation().replace(/\[([0-9]*)\]/gm, '.$1');
                    extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.value, JSX_TEXT_TYPE));
                }
            }
        }
    );
    for (let [key, value] of Object.entries(flatParseTree)) {
        if (value === JSX_EXPERESSION_TYPE && !key.includes('attribute')) {
            let {textKey, extractedText} = modifyNodeKeyAndGetNodeValue(
                key,
                'type',
                'expression.value',
                flatParseTree
            );

            if (textKey in flatParseTree && extractedText && typeof extractedText === "string") {
                extractedText = exports.cleanUpExtractedString(extractedText);
                if (extractedText.length !== 0) {
                    extractedStringsWithTypeAndPath.push(constructStringObject(textKey, extractedText, JSX_EXPERESSION_TYPE));
                }
            }
        } else if (value === "title" && key.includes('attribute')) {
            let {textKey, extractedText} = modifyNodeKeyAndGetNodeValue(
                key,
                'name.name',
                'value.expression.value',
                flatParseTree
            );

            if (textKey in flatParseTree && extractedText && typeof extractedText === "string") {
                extractedText = exports.cleanUpExtractedString(extractedText);
                if (extractedText.length !== 0) {
                    extractedStringsWithTypeAndPath.push(constructStringObject(textKey, extractedText, JSX_ATTRIBUTE_TYPE));
                }
            }
        }
    }
    return extractedStringsWithTypeAndPath;
};

exports.extractStrings = jsFileContent => {
    let flatParseTree = getFlatParseTree(jsFileContent);
    return getAllJSXStringsWithTypeAndPath(flatParseTree, jsFileContent);
};

// const dirPath = '/Users/omar/Desktop/Work/shapa-react-native/src/components/screens/';
//
// fs.readdirSync(dirPath).forEach(jsFileName => {
//     if (jsFileName.endsWith('.js')) {
//         let jsFilePath = dirPath + jsFileName;
//         let jsonFilePath = 'en.json';
//         let jsFileContent = exports.readJsFileContent(jsFilePath);
//         console.log(jsFileName);
//         exports.replaceStringsWithKeys(jsFileContent, jsFileName, jsonFilePath)
//     }
// });
