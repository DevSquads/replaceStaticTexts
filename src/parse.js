const babelParser = require("@babel/core");
const babelTraverse = require("@babel/traverse");
const babelGenerator = require('@babel/generator');
const babelTypes = require('@babel/types');
const fs = require("fs");

const JSX_TEXT_TYPE = 'JSXText';
const JSX_EXPRESSION_TYPE = 'JSXExpressionContainer';
const JSX_ATTRIBUTE_TYPE = 'JSXAttribute';
const TEMPLATE_ELEMENT = 'TemplateElement';
const CONDITIONAL_EXPRESSION_TYPE = 'ConditionalExpression';
const OBJECT_PROPERTY_TYPE = 'ObjectProperty';
const CALL_EXPRESSION_TYPE = 'CallExpression';
const RETURN_EXPRESSION_TYPE = 'ReturnExpression';

exports.writeImportStatementToJsFile = (parsedTree, jsFilePath) => {
    let jsFileDirDepth = jsFilePath.substring(jsFilePath.indexOf('src') + 4).split('/').length - 1;
    let i18nPath = '../'.repeat(jsFileDirDepth) + 'services/internationalizations/i18n';
    babelTraverse.default(parsedTree, {
        Program(path) {
            let importAlreadyExists = false;
            path.traverse({
               ImportDeclaration(path) {
                   if(path.node.specifiers[0].local.name === 'I18n') {
                       importAlreadyExists = true;
                   }
               }
            });
            if(importAlreadyExists) {
                return;
            }
            let lastImport = path.get("body").filter(p => p.isImportDeclaration()).pop();
            const identifier = babelTypes.identifier('I18n');
            const importDefaultSpecifier = babelTypes.importDefaultSpecifier(identifier);
            const importDeclaration = babelTypes.importDeclaration([importDefaultSpecifier], babelTypes.stringLiteral(i18nPath));

            if (lastImport) {
                lastImport.insertAfter(importDeclaration);
                lastImport = path.get("body").filter(p => p.isImportDeclaration()).pop();
                lastImport.insertAfter(babelTypes.jsxEmptyExpression());
            }
        }
    });
};

exports.extractStrings = jsFileContent => {
    let nodeProcessors = {
        parsedTree: getParsedTree(jsFileContent),
        processedObject: [],
        jsxTextNodeProcessor(path, extractedStringsWithTypeAndPath) {
            let nodePath = getNodePath(path);
            extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.value.toString(), JSX_TEXT_TYPE));
        },

        jsxExpressionContainerNodeProcessor(path, extractedStringsWithTypeAndPath) {
            let nodePath = getNodePath(path);
            extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.extra.rawValue, JSX_EXPRESSION_TYPE));
        },

        jsxTitleAttributeNodeProcessor(path, extractedStringsWithTypeAndPath) {
            let nodePath = getNodePath(path);
            extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.extra.rawValue, JSX_ATTRIBUTE_TYPE));
        },
        templateElementNodeProcessor(path, extractedStringsWithTypeAndPath) {
            let nodePath = getNodePath(path);
            extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.value.raw, TEMPLATE_ELEMENT));
        },
        conditionalExpressionNodeProcessor(path, extractedStringsWithTypeAndPath) {
            let nodePath = getNodePath(path);
            extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.extra.rawValue, CONDITIONAL_EXPRESSION_TYPE));
        },
        objectPropertyNodeProcessor(path, extractedStringsWithTypeAndPath) {
            let nodePath = getNodePath(path);
            extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.extra.rawValue, OBJECT_PROPERTY_TYPE));
        },
        callExpressionNodeProcessor(path, extractedStringsWithTypeAndPath) {
            let nodePath = path.getPathLocation().replace(/\[([0-9]*)\]/gm, '.$1');
            extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.extra.rawValue, CALL_EXPRESSION_TYPE));
        },
        returnExpressionNodeProcessor(path, extractedStringsWithTypeAndPath) {
            let nodePath = path.getPathLocation().replace(/\[([0-9]*)\]/gm, '.$1');
            extractedStringsWithTypeAndPath.push(constructStringObject(nodePath, path.node.extra.rawValue, RETURN_EXPRESSION_TYPE));
        }
    };

    return traverseAndProcessAbstractSyntaxTree(jsFileContent, nodeProcessors);
};

exports.replaceStringsWithKeys = (fileContent, jsFileName, jsonFileName, jsFilePath = `output/${jsFileName}`) => {
    let extractedStrings = exports.extractStrings(fileContent);
    let extractedStringsWithKeyAndPath = exports.writeToJsonFile(jsonFileName, jsFileName, extractedStrings);
    let parsedTree = getParsedTree(fileContent);
    if (extractedStrings.length) {
        exports.writeImportStatementToJsFile(parsedTree, jsFilePath);
    }
    else {
        return fileContent;
    }

    let nodeProcessors = {
        parsedTree: parsedTree,
        processedObject: extractedStringsWithKeyAndPath,
        jsxTextNodeProcessor(path, extractedStringsWithKeyAndPath) {
            path.node.value = `{I18n.t("${extractedStringsWithKeyAndPath[0].key}")}`;
            extractedStringsWithKeyAndPath.shift();
        },
        jsxExpressionContainerNodeProcessor(path, extractedStringsWithKeyAndPath) {
            path.node.extra.raw = `I18n.t(\"${extractedStringsWithKeyAndPath[0].key}\")`;
            extractedStringsWithKeyAndPath.shift();
        },
        jsxTitleAttributeNodeProcessor(path, extractedStringsWithKeyAndPath, isAnExpression) {
            if (isAnExpression) {
                path.node.extra.raw = `I18n.t("${extractedStringsWithKeyAndPath[0].key}")`;
            } else {
                path.node.extra.raw = `{I18n.t("${extractedStringsWithKeyAndPath[0].key}")}`;
            }
            extractedStringsWithKeyAndPath.shift();
        },
        templateElementNodeProcessor(path, extractedStringsWithKeyAndPath) {
            path.node.value.raw = "${I18n.t(\"" + `${extractedStringsWithKeyAndPath[0].key}` + "\")}";
            extractedStringsWithKeyAndPath.shift();
        },
        conditionalExpressionNodeProcessor(path, extractedStringsWithKeyAndPath) {
            path.node.extra.raw = `I18n.t("${extractedStringsWithKeyAndPath[0].key}")`;
            extractedStringsWithKeyAndPath.shift();
        }
        ,
        objectPropertyNodeProcessor(path, extractedStringsWithKeyAndPath) {
            path.node.extra.raw = `I18n.t("${extractedStringsWithKeyAndPath[0].key}")`;
            extractedStringsWithKeyAndPath.shift();
        }
        ,
        callExpressionNodeProcessor(path, extractedStringsWithKeyAndPath, isAnExpression) {
            path.node.extra.raw = `I18n.t("${extractedStringsWithKeyAndPath[0].key}")`;
            extractedStringsWithKeyAndPath.shift();
        },
        returnExpressionNodeProcessor(path, extractedStringsWithKeyAndPath, isAnExpression) {
            path.node.extra.raw = `I18n.t("${extractedStringsWithKeyAndPath[0].key}")`;
            extractedStringsWithKeyAndPath.shift();
        }
    };

    traverseAndProcessAbstractSyntaxTree(fileContent, nodeProcessors);

    let newFileContent = babelGenerator.default(parsedTree, {sourceMap: true}, fileContent);
    writeToFile(jsFilePath, newFileContent);
    return newFileContent.code;
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
    if (extractedString === ':') {
        return '';
    }
    return extractedString.replace(/[\t\n]+/gm, ' ').trim();
};

const writeToFile = (jsFileName, newFileContent) => {
    fs.writeFileSync(jsFileName, newFileContent.code);
};

const isVisited = (visitedNodePaths, path) => {
    if (!visitedNodePaths[getNodePath(path)]) {
        visitedNodePaths[getNodePath(path)] = true;
        return false;
    }
    return true;
};

const shouldBeIgnored = path => {
    let ignoredPaths = [
        'StyleSheet',
        'Dimensions',
        'emoji',
        'setDrawerEnabled',
        'OS',
        'moment',
        'utcMoment',
        'handleChangedInput',
        'addEventListener',
        'removeEventListener',
        'PropTypes',
        'style',
        'margin',
        'position',
        'display',
        'color',
        'orderBy',
        'format',
        'editingMode',
        'config',
        'loading',
        'require',
        'animated',
        'side',
        'endOf',
        'animationType',
        'backgroundColor',
        'innerRingColor',
        'outerRingColor',
        'outputRange',
        'playSound',
        'fontColor',
        'disableButtons',
        'inchesIsFocused',
        'onFormFocus',
        'onFormBlur',
        'flexDirection',
        'logInWithReadPermissions',
        'mediaType',
        'layoutType',
        'set',
        'get',
        'add',
        'pick',
        'alignSelf',
        'justifyContent',
        'alignItems',
        'generateChoiceSelection',
        'generateTimeSelection',
        'localMoment',
        'I18n',
        't',
        'bulletsDirection',
        'map'
    ];
    return ignoredPaths.includes(path.node.name);
};

const traverseAndProcessAbstractSyntaxTree = (jsFileContent, opts) => {
    let visitedNodePaths = {};
    let astVisitors = {
        JSXText(path) {
            if (exports.cleanUpExtractedString(path.node.value).length !== 0) {
                opts.jsxTextNodeProcessor(path, opts.processedObject);
            }
        },
        JSXExpressionContainer(path) {
            let shouldNotBeIgnored = true;
            path.traverse({
                Identifier(path) {
                    if (shouldBeIgnored(path)) {
                        shouldNotBeIgnored = false;
                        return;
                    }
                }
            });
            if (shouldNotBeIgnored) {
                path.traverse({
                    StringLiteral(path) {
                        let nodePath = getNodePath(path);
                        if (!nodePath.includes('attribute')) {
                            if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                                if (!isVisited(visitedNodePaths, path)) {
                                    opts.jsxExpressionContainerNodeProcessor(path, opts.processedObject);
                                }
                            }
                        }
                    },
                    TemplateElement(path) {
                        if (!isVisited(visitedNodePaths, path)) {
                            if (exports.cleanUpExtractedString(path.node.value.raw).length !== 0) {
                                opts.templateElementNodeProcessor(path, opts.processedObject);
                            }
                        }
                    }
                })
            }
        },
        JSXOpeningElement(path) {
            path.traverse({
                JSXAttribute(path) {
                    let shouldNotIgnorePath = true;
                    let isAnExpression = false;
                    path.traverse({
                        JSXExpressionContainer(path) {
                            isAnExpression = true;
                            return;
                        },
                        Identifier(path) {
                            if (shouldBeIgnored(path)) {
                                shouldNotIgnorePath = false;
                                return;
                            }
                        },
                        JSXIdentifier(path) {
                            if (shouldBeIgnored(path)) {
                                shouldNotIgnorePath = false;
                                return;
                            }
                        }
                    });

                    if (path.node.name.name === 'title' ||
                        path.node.name.name === 'content' ||
                        path.node.name.name === 'placeholder' ||
                        path.node.name.name === 'errMessage' ||
                        path.node.name.name === 'tip' ||
                        path.node.name.name === 'buttonText' ||
                        path.node.name.name === 'confirmBtnText' ||
                        path.node.name.name === 'cancelBtnText' ||
                        path.node.name.name === 'sectionTitle' ||
                        path.node.name.name === 'sectionText' ||
                        path.node.name.name === 'info') {
                        if(shouldNotIgnorePath) {
                            path.traverse({
                                StringLiteral(path) {
                                    if (!isVisited(visitedNodePaths, path)) {
                                        if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                                            opts.jsxTitleAttributeNodeProcessor(path, opts.processedObject, isAnExpression);
                                        }
                                    }
                                },
                                TemplateElement(path) {
                                    if (!isVisited(visitedNodePaths, path)) {
                                        if (exports.cleanUpExtractedString(path.node.value.raw).length !== 0) {
                                            opts.templateElementNodeProcessor(path, opts.processedObject);
                                        }
                                    }
                                }
                            });
                        }
                    }
                }
            })
        },
        ConditionalExpression(path) {
            let shouldNotBeIgnored = true;
            let isAnExpression = false;
            let parent = path.findParent((path) => path.getPathLocation());
            if (parent.node.id != null && (
                parent.node.id.name === 'flexDirection' ||
                parent.node.id.name === 'layoutType' ||
                parent.node.id.name === 'keyboardType' ||
                parent.node.id.name === 'fontColor')) {
                shouldNotBeIgnored = false;
            }
            path.traverse({
                Identifier(path) {
                    if (shouldBeIgnored(path)) {
                        shouldNotBeIgnored = false;
                        return;
                    }
                    path.traverse({
                        JSXExpressionContainer(path) {
                            isAnExpression = true;
                            return;
                        }
                    });
                },
                JSXIdentifier(path) {
                    if (shouldBeIgnored(path)) {
                        shouldNotBeIgnored = false;
                        return;
                    }
                    path.traverse({
                        JSXExpressionContainer(path) {
                            isAnExpression = true;
                            return;
                        }
                    });
                }
            });
            if (shouldNotBeIgnored) {
                path.traverse({
                    StringLiteral(path) {
                        if (!isVisited(visitedNodePaths, path)) {
                            if (path.getPathLocation().includes('alternate') || path.getPathLocation().includes('consequent')) {
                                if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                                    opts.conditionalExpressionNodeProcessor(path, opts.processedObject, isAnExpression);
                                }
                            }
                        }
                    },
                    TemplateElement(path) {
                        if (!isVisited(visitedNodePaths, path)) {
                            if (exports.cleanUpExtractedString(path.node.value.raw).length !== 0) {
                                opts.templateElementNodeProcessor(path, opts.processedObject, isAnExpression);
                            }
                        }
                    }
                });
            }
        },
        AssignmentExpression(path) {
            path.traverse({
                ObjectProperty(path) {
                    let shouldNotIgnorePath = true;
                    path.traverse({
                        Identifier(path) {
                            if (shouldBeIgnored(path)) {
                                shouldNotIgnorePath = false;
                                return;
                            }
                        },
                        JSXIdentifier(path) {
                            if (shouldBeIgnored(path)) {
                                shouldNotIgnorePath = false;
                                return;
                            }
                        }
                    });
                    if (shouldNotIgnorePath) {
                        path.traverse({
                            StringLiteral(path) {
                                if (!isVisited(visitedNodePaths, path)) {
                                    if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                                        opts.objectPropertyNodeProcessor(path, opts.processedObject);
                                    }
                                }
                            },
                            TemplateElement(path) {
                                if (!isVisited(visitedNodePaths, path)) {
                                    if (exports.cleanUpExtractedString(path.node.value.raw).length !== 0) {
                                        opts.templateElementNodeProcessor(path, opts.processedObject);
                                    }
                                }
                            }
                        })
                    }
                }
            });
        },
        VariableDeclaration(path) {
            let shouldNotBeIgnored = true;
            path.traverse({
                Identifier(path) {
                    if (shouldBeIgnored(path)) {
                        shouldNotBeIgnored = false;
                        return;
                    }
                },
                JSXIdentifier(path) {
                    if (shouldBeIgnored(path)) {
                        shouldNotBeIgnored = false;
                        return;
                    }
                }
            });
            if (shouldNotBeIgnored) {
                path.traverse({
                    ObjectProperty(path) {
                        path.traverse({
                            StringLiteral(path) {
                                if (!isVisited(visitedNodePaths, path)) {
                                    if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                                        opts.objectPropertyNodeProcessor(path, opts.processedObject);
                                    }
                                }
                            },
                            TemplateElement(path) {
                                if (!isVisited(visitedNodePaths, path)) {
                                    if (exports.cleanUpExtractedString(path.node.value.raw).length !== 0) {
                                        opts.templateElementNodeProcessor(path, opts.processedObject);
                                    }
                                }
                            }
                        })
                    },
                    ArrayExpression(path) {
                        path.traverse({
                            StringLiteral(path) {
                                if (!isVisited(visitedNodePaths, path)) {
                                    if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                                        opts.objectPropertyNodeProcessor(path, opts.processedObject);
                                    }
                                }
                            },
                            TemplateElement(path) {
                                if (!isVisited(visitedNodePaths, path)) {
                                    if (exports.cleanUpExtractedString(path.node.value.raw).length !== 0) {
                                        opts.templateElementNodeProcessor(path, opts.processedObject);
                                    }
                                }
                            }
                        })
                    }
                })
            }
        },
        CallExpression(path) {
            let shouldNotBeIgnored = true;
            path.traverse({
                Identifier(path) {
                    if (shouldBeIgnored(path)) {
                        shouldNotBeIgnored = false;
                        return;
                    }
                },
                JSXIdentifier(path) {
                    if (shouldBeIgnored(path)) {
                        shouldNotBeIgnored = false;
                        return;
                    }
                }
            });
            if (shouldNotBeIgnored) {
                path.traverse({
                    StringLiteral(path) {
                        if (path.getPathLocation().includes('arguments')) {
                            if (!isVisited(visitedNodePaths, path)) {
                                if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                                    opts.callExpressionNodeProcessor(path, opts.processedObject);
                                }
                            }
                        }
                    },
                    TemplateElement(path) {
                        if (!isVisited(visitedNodePaths, path)) {
                            if (exports.cleanUpExtractedString(path.node.value.raw).length !== 0) {
                                opts.templateElementNodeProcessor(path, opts.processedObject);
                            }
                        }
                    }
                })
            }
        },
        Function(path) {
            //console.log(path);
            if (path.node.key != null &&
                (path.node.key.name === 'calculateKeyboardType' ||
                    path.node.key.name === 'processOutgoingValue' ||
                    path.node.key.name === 'getBackgroundColors')) {
                return;
            }
            path.traverse({
                ReturnStatement(path) {
                    let shouldNotBeIgnored = true;

                    path.traverse({
                        Identifier(path) {
                            if (shouldBeIgnored(path)) {
                                shouldNotBeIgnored = false;
                                return;
                            }
                        },
                        JSXIdentifier(path) {
                            if (shouldBeIgnored(path)) {
                                shouldNotBeIgnored = false;
                                return;
                            }
                        }
                    });
                    if (shouldNotBeIgnored) {
                        path.traverse({
                            StringLiteral(path) {
                                if (path.getPathLocation().includes('argument') && !path.getPathLocation().includes('expression')) {
                                    if (!isVisited(visitedNodePaths, path)) {
                                        if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                                            opts.returnExpressionNodeProcessor(path, opts.processedObject);
                                        }
                                    }
                                }
                            },
                            TemplateElement(path) {
                                if (!isVisited(visitedNodePaths, path) && !path.getPathLocation().includes('expression')) {
                                    if (exports.cleanUpExtractedString(path.node.value.raw).length !== 0) {
                                        opts.templateElementNodeProcessor(path, opts.processedObject);
                                    }
                                }
                            }
                        })
                    }
                }
            })
        }
    };

    babelTraverse.default(opts.parsedTree, astVisitors);

    return opts.processedObject;
};

const getNodePath = path => {
    return path.getPathLocation().replace(/\[([0-9]*)\]/gm, '.$1');
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

const writeToJsonFileWithIndentation = (jsonFileName, jsonFileContent) => {
    fs.writeFileSync(jsonFileName, JSON.stringify(jsonFileContent, null, 4));
};

const getParsedTree = jsFileContent => {
    let parseTree = babelParser.parse(jsFileContent, {
        presets: ["@babel/preset-react"],
        plugins: ["@babel/plugin-proposal-class-properties"]
    });
    return parseTree;
};

const cleanUpIndentation = extractedText => {
    return extractedText.replace(/^\n[\t ]{2,}/gm, '').replace(/\n[\t ]{2,}$/gm, '').replace(/\n[\t ]{2,}/gm, '\n');
}

const constructStringObject = (textKey, extractedText, stringType) => {
    return {
        path: textKey.replace('.value', ''),
        type: stringType,
        value: cleanUpIndentation(extractedText)
    };
};

const walkSync = (dir, filelist) => {
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

// (function main() {
//     //validatedInput_ValidatedInput
//     ///Users/xamohsen/devsquads/shapa-react-native/src/components/buttons/AddPhotoButton.js
//     let dirPath = '/Users/omar/Desktop/Work/shapa-react-native/src/utils';
//     if (!fs.existsSync('output')) {
//         fs.mkdirSync('output');
//     }
//     let files = walkSync(dirPath, []);
//     files.forEach(jsFilePath => {
//             if (jsFilePath.endsWith('.js') && !jsFilePath.endsWith('LanguageSetting.js') && !jsFilePath.endsWith('App.js') && !jsFilePath.toUpperCase().includes('DEPRECATED')) {
//                 let jsFileName = jsFilePath.split('/').reverse()[1] + '_' + jsFilePath.split('/').reverse()[0];
//                 let jsonFilePath = './src/en.json';
//                 let jsFileContent = exports.readJsFileContent(jsFilePath);
//                 console.log(jsFileName);
//                 exports.replaceStringsWithKeys(jsFileContent, jsFileName, jsonFilePath, jsFilePath);
//             }
//         }
//     );
// });