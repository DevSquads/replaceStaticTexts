const babelParser = require("@babel/core");
const babelTraverse = require("@babel/traverse");
const babelGenerator = require('@babel/generator');
const fs = require("fs");

const JSX_TEXT_TYPE = 'JSXText';
const JSX_EXPERESSION_TYPE = 'JSXExpressionContainer';
const JSX_ATTRIBUTE_TYPE = 'JSXAttribute';
const TEMPLATE_ELEMENT = 'TemplateElement';
const CONDITIONAL_EXPRESSION_TYPE = 'ConditionalExpression';
const OBJECT_PROPERTY_TYPE = 'ObjectProperty';
const CALL_EXPRESSION_TYPE = 'CallExpression';
const writeToFile = (jsFileName, newFileContent) => {
    fs.writeFileSync('output/' + jsFileName, newFileContent.code);
};

function isVisited(visitedNodePaths, path) {
    if (!visitedNodePaths[getNodePath(path)]) {
        visitedNodePaths[getNodePath(path)] = true;
        return false;
    }
    return true;
}

const traverseAndProcessAbstractSyntaxTree = (jsFileContent, opts) => {
    let visitedNodePaths = {};
    let astVisitors = {
        JSXText(path) {
            opts.jsxTextNodeProcessor(path, opts.processedObject);
        },
        JSXExpressionContainer(path) {
            path.traverse({
                StringLiteral(path) {
                    if (!isVisited(visitedNodePaths, path)) {
                        opts.jsxExpressionContainerNodeProcessor(path, opts.processedObject);
                    }
                }
            })
        },
        JSXOpeningElement(path) {
            path.traverse({
                JSXAttribute(path) {
                    if (path.node.name.name === 'title') {
                        path.traverse({
                            StringLiteral(path) {
                                if (!isVisited(visitedNodePaths, path)) {
                                    opts.jsxTitleAttributeNodeProcessor(path, opts.processedObject);
                                }
                            }
                        })

                    }
                }
            })
        },
        TemplateElement(path) {
            if (!isVisited(visitedNodePaths, path)) {
                opts.templateElementNodeProcessor(path, opts.processedObject);
            }
        },
        ConditionalExpression(path) {
            let notARequireStatement = true;
            path.traverse({
                Identifier(path) {
                    if (path.node.name === 'require') {
                        notARequireStatement = false;
                        return;
                    }
                }
            });
            if (notARequireStatement) {
                path.traverse({
                    StringLiteral(path) {
                        if (!isVisited(visitedNodePaths, path)) {
                            opts.conditionalExpressionNodeProcessor(path, opts.processedObject);
                        }
                    }
                });
            }
        },
        AssignmentExpression(path) {
            let notAStyleSheet = true;
            path.traverse({
                Identifier(path) {
                    if (path.node.name === 'StyleSheet') {
                        notAStyleSheet = false;
                        return;
                    }
                }
            });
            if (notAStyleSheet) {
                path.traverse({
                    ObjectProperty(path) {
                        path.traverse({
                            StringLiteral(path) {
                                if (!isVisited(visitedNodePaths, path)) {
                                    opts.objectPropertyNodeProcessor(path, opts.processedObject);
                                }
                            }
                        })
                    }
                });
            }
        },
        VariableDeclaration(path) {
            let notAStyleSheet = true;
            path.traverse({
                Identifier(path) {
                    if (path.node.name === 'StyleSheet') {
                        notAStyleSheet = false;
                        return;
                    }
                }
            });
            if (notAStyleSheet) {
                path.traverse({
                    ObjectProperty(path) {
                        path.traverse({
                            StringLiteral(path) {
                                if (!isVisited(visitedNodePaths, path)) {
                                    opts.objectPropertyNodeProcessor(path, opts.processedObject);
                                }
                            }
                        })
                    }
                })
            }
        },
        CallExpression(path) {
            let notARequireStatementOrStyleSheet = true;
            path.traverse({
                Identifier(path) {
                    if (path.node.name === 'require' ||
                        path.node.name === 'StyleSheet' ||
                        path.node.name === 'Dimensions' ||
                        path.node.name === 'emoji') {
                        notARequireStatementOrStyleSheet = false;
                        return;
                    }
                }
            });
            if (notARequireStatementOrStyleSheet) {
                path.traverse({
                    StringLiteral(path) {
                        if (path.getPathLocation().includes('arguments')) {
                            if (!isVisited(visitedNodePaths, path)) {
                                opts.callExpressionNodeProcessor(path, opts.processedObject);
                            }
                        }
                    }
                })
            }
        }

    };

    babelTraverse.default(opts.parsedTree, astVisitors);

    return opts.processedObject;
};

function getNodePath(path) {
    return path.getPathLocation().replace(/\[([0-9]*)\]/gm, '.$1');
}

exports.extractStrings = jsFileContent => {
    let nodeProcessors = {
        parsedTree: getParsedTree(jsFileContent),
        processedObject: [],
        jsxTextNodeProcessor(path, extractedStringsWithTypeAndPath) {
            if (exports.cleanUpExtractedString(path.node.value).length !== 0) {
                let nodePath = getNodePath(path);
                extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.value.toString(), JSX_TEXT_TYPE));
            }
        },

        jsxExpressionContainerNodeProcessor(path, extractedStringsWithTypeAndPath) {
            if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                let nodePath = getNodePath(path);
                if (!nodePath.includes('attribute')) {
                    extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.extra.rawValue, JSX_EXPERESSION_TYPE));
                }
            }
        },

        jsxTitleAttributeNodeProcessor(path, extractedStringsWithTypeAndPath) {
            if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                let nodePath = getNodePath(path);
                extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.extra.rawValue, JSX_ATTRIBUTE_TYPE));
            }
        },
        templateElementNodeProcessor(path, extractedStringsWithTypeAndPath) {
            if (exports.cleanUpExtractedString(path.node.value.raw).length !== 0) {
                let nodePath = getNodePath(path);
                extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.value.raw, TEMPLATE_ELEMENT));
            }
        },
        conditionalExpressionNodeProcessor(path, extractedStringsWithTypeAndPath) {
            if (path.getPathLocation().includes('alternate') || path.getPathLocation().includes('consequent')) {
                if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                    let nodePath = getNodePath(path);
                    extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.extra.rawValue, CONDITIONAL_EXPRESSION_TYPE));
                }
            }
        },
        objectPropertyNodeProcessor(path, extractedStringsWithTypeAndPath) {
            if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                let nodePath = getNodePath(path);
                extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.extra.rawValue, OBJECT_PROPERTY_TYPE));
            }
        },
        callExpressionNodeProcessor(path, extractedStringsWithTypeAndPath) {
            if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                let nodePath = path.getPathLocation().replace(/\[([0-9]*)\]/gm, '.$1');
                extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.extra.rawValue, CALL_EXPRESSION_TYPE));
            }
        }
    };

    return traverseAndProcessAbstractSyntaxTree(jsFileContent, nodeProcessors);
};

exports.replaceStringsWithKeys = (fileContent, jsFileName, jsonFileName) => {
    let extractedStrings = exports.extractStrings(fileContent);
    let extractedStringsWithKeyAndPath = exports.writeToJsonFile(jsonFileName, jsFileName, extractedStrings);
    let parsedTree = getParsedTree(fileContent);

    let nodeProcessors = {
        parsedTree: parsedTree,
        processedObject: extractedStringsWithKeyAndPath,
        jsxTextNodeProcessor(path, extractedStringsWithKeyAndPath) {
            if (exports.cleanUpExtractedString(path.node.value).length !== 0 && extractedStringsWithKeyAndPath[0].value === path.node.value) {
                path.node.value = `{I18n.t("${extractedStringsWithKeyAndPath[0].key}")}`;
                extractedStringsWithKeyAndPath.shift();
            }
        },
        jsxExpressionContainerNodeProcessor(path, extractedStringsWithKeyAndPath) {
            let nodePath = getNodePath(path);
            if (!nodePath.includes('attribute')) {
                if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0 && extractedStringsWithKeyAndPath[0].value === path.node.value) {
                    path.node.extra.raw = `I18n.t("${extractedStringsWithKeyAndPath[0].key}")`;
                    extractedStringsWithKeyAndPath.shift();
                }
            }
        },
        jsxTitleAttributeNodeProcessor(path, extractedStringsWithKeyAndPath) {
            if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                if (path.getPathLocation().includes('expression')) {
                    path.node.extra.raw = `I18n.t("${extractedStringsWithKeyAndPath[0].key}")`;
                } else {
                    path.node.extra.raw = `{I18n.t("${extractedStringsWithKeyAndPath[0].key}")}`;
                }
                extractedStringsWithKeyAndPath.shift();
            }
        },
        templateElementNodeProcessor(path, extractedStringsWithKeyAndPath) {
            if (exports.cleanUpExtractedString(path.node.value.raw).length !== 0) {
                path.node.value.raw = "${I18n.t(\"" + `${extractedStringsWithKeyAndPath[0].key}` + "\")}";
                extractedStringsWithKeyAndPath.shift();
            }
        },
        conditionalExpressionNodeProcessor(path, extractedStringsWithKeyAndPath) {
            if (path.getPathLocation().includes('alternate') || path.getPathLocation().includes('consequent')) {
                if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                    path.node.extra.raw = `{I18n.t("${extractedStringsWithKeyAndPath[0].key}")}`;
                    extractedStringsWithKeyAndPath.shift();
                }
            }
        },
        objectPropertyNodeProcessor(path, extractedStringsWithKeyAndPath) {
            if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                path.node.extra.raw = `I18n.t("${extractedStringsWithKeyAndPath[0].key}")`;
                extractedStringsWithKeyAndPath.shift();
            }
        },
        callExpressionNodeProcessor(path, extractedStringsWithKeyAndPath) {
            if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                path.node.extra.raw = `I18n.t("${extractedStringsWithKeyAndPath[0].key}")`;
                extractedStringsWithKeyAndPath.shift();
            }
        }
    };

    traverseAndProcessAbstractSyntaxTree(fileContent, nodeProcessors);

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
    let parseTree = babelParser.parse(jsFileContent, {
        presets: ["@babel/preset-react"],
        plugins: ["@babel/plugin-proposal-class-properties"]
    });
    fs.writeFileSync('output-tree.json', JSON.stringify(parseTree));
    return parseTree;
};

const constructStringObject = (textKey, extractedText, stringType) => {
    return {
        path: textKey.replace('.value', ''),
        type: stringType,
        value: extractedText
    };
};

const walkSync = function (dir, filelist) {
    let files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(dir + '/' + file).isDirectory()) {
            filelist = walkSync(dir + '/' + file, filelist);
        } else {
            filelist.push(dir + '/' + file);
        }
    });
    return filelist;
};

(function main() {
    ///Users/omar/WebstormProjects/parser-test/output/MissionAdvertHeader.js
    let dirPath = '/Users/omar/Desktop/Work/shapa-react-native/src/components';
    if (!fs.existsSync('output')) {
        fs.mkdirSync('output');
    }
    let files = walkSync(dirPath, []);
    files.forEach(jsFilePath => {
            if (jsFilePath.endsWith('MissionAdvertHeader.js')) {
                let jsFileName = jsFilePath.split('/').reverse()[0];
                let jsonFilePath = 'en.json';
                let jsFileContent = exports.readJsFileContent(jsFilePath);
                console.log(jsFileName);
                exports.replaceStringsWithKeys(jsFileContent, jsFileName, jsonFilePath);
            }
        }
    );
});
