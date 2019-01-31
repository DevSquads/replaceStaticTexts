/* eslint no-shadow: 0 no-param-reassign: 0 */
const babelParser = require('@babel/core');
const babelTraverse = require('@babel/traverse');
const babelGenerator = require('@babel/generator');
const fs = require('fs');

const JSX_TEXT_TYPE = 'JSXText';
const JSX_EXPRESSION_TYPE = 'JSXExpressionContainer';
const JSX_ATTRIBUTE_TYPE = 'JSXAttribute';
const TEMPLATE_ELEMENT = 'TemplateElement';
const CONDITIONAL_EXPRESSION_TYPE = 'ConditionalExpression';
const OBJECT_PROPERTY_TYPE = 'ObjectProperty';
const CALL_EXPRESSION_TYPE = 'CallExpression';
const RETURN_EXPRESSION_TYPE = 'ReturnExpression';
const Parser = require('./Parser');
const Traverser = require('./Traverser');

const cleanUpIndentation = extractedText => extractedText.replace(/^\n[\t ]{2,}/gm, '').replace(/\n[\t ]{2,}$/gm, '').replace(/\n[\t ]{2,}/gm, '\n');

const constructStringObject = (textKey, extractedText, stringType) => ({
  path: textKey.replace('.value', ''),
  type: stringType,
  value: cleanUpIndentation(extractedText),
});

const shouldBeIgnored = (path) => {
  const ignoredPaths = [
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
    'map',
  ];
  return ignoredPaths.includes(path.node.name);
};

const getNodePath = path => path.getPathLocation().replace(/\[([0-9]*)\]/gm, '.$1');

const isVisited = (visitedNodePaths, path) => {
  if (!visitedNodePaths[getNodePath(path)]) {
    visitedNodePaths[getNodePath(path)] = true;
    return false;
  }
  return true;
};

const getStringKey = (fileName, extractedStrings, index, typeCount) => `${fileName.replace('.js', '')}.${extractedStrings[index].type}.index(${typeCount - 1})`;

const getStringValue = (extractedStrings, index) => `${extractedStrings[index].value}`;

const insertNewEntryInJsonObject = (
  fileName,
  extractedStrings,
  index,
  jsonFileContent,
  extractedStringsWithKeyAndPath,
  typeCount,
) => {
  const stringKey = getStringKey(fileName, extractedStrings, index, typeCount);
  const stringValue = getStringValue(extractedStrings, index);

  jsonFileContent[stringKey] = stringValue;

  extractedStringsWithKeyAndPath.push({
    key: stringKey,
    path: extractedStrings[index].path,
    value: stringValue,
  });
};

const writeToJsonFileWithIndentation = (jsonFileName, jsonFileContent) => {
  fs.writeFileSync(jsonFileName, JSON.stringify(jsonFileContent, null, 4));
};

const traverseAndProcessAbstractSyntaxTree = (jsFileContent, opts) => {
  const visitedNodePaths = {};
  const astVisitors = {
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
          }
        },
      });
      if (shouldNotBeIgnored) {
        path.traverse({
          StringLiteral(path) {
            const nodePath = getNodePath(path);
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
          },
        });
      }
    },
    JSXOpeningElement(path) {
      path.traverse({
        JSXAttribute(path) {
          let shouldNotIgnorePath = true;
          let isAnExpression = false;
          path.traverse({
            JSXExpressionContainer() {
              isAnExpression = true;
            },
            Identifier(path) {
              if (shouldBeIgnored(path)) {
                shouldNotIgnorePath = false;
              }
            },
            JSXIdentifier(path) {
              if (shouldBeIgnored(path)) {
                shouldNotIgnorePath = false;
              }
            },
          });

          if (path.node.name.name === 'title'
            || path.node.name.name === 'content'
            || path.node.name.name === 'placeholder'
            || path.node.name.name === 'errMessage'
            || path.node.name.name === 'tip'
            || path.node.name.name === 'buttonText'
            || path.node.name.name === 'confirmBtnText'
            || path.node.name.name === 'cancelBtnText'
            || path.node.name.name === 'sectionTitle'
            || path.node.name.name === 'sectionText'
            || path.node.name.name === 'info') {
            if (shouldNotIgnorePath) {
              path.traverse({
                StringLiteral(path) {
                  if (!isVisited(visitedNodePaths, path)) {
                    if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                      opts.jsxTitleAttributeNodeProcessor(
                        path,
                        opts.processedObject,
                        isAnExpression,
                      );
                    }
                  }
                },
                TemplateElement(path) {
                  if (!isVisited(visitedNodePaths, path)) {
                    if (exports.cleanUpExtractedString(path.node.value.raw).length !== 0) {
                      opts.templateElementNodeProcessor(path, opts.processedObject);
                    }
                  }
                },
              });
            }
          }
        },
      });
    },
    ConditionalExpression(path) {
      let shouldNotBeIgnored = true;
      let isAnExpression = false;
      const parent = path.findParent(path => path.getPathLocation());
      if (parent.node.id != null && (
        parent.node.id.name === 'flexDirection'
        || parent.node.id.name === 'layoutType'
        || parent.node.id.name === 'keyboardType'
        || parent.node.id.name === 'fontColor')) {
        shouldNotBeIgnored = false;
      }
      path.traverse({
        Identifier(path) {
          if (shouldBeIgnored(path)) {
            shouldNotBeIgnored = false;
            return;
          }
          path.traverse({
            JSXExpressionContainer() {
              isAnExpression = true;
            },
          });
        },
        JSXIdentifier(path) {
          if (shouldBeIgnored(path)) {
            shouldNotBeIgnored = false;
            return;
          }
          path.traverse({
            JSXExpressionContainer() {
              isAnExpression = true;
            },
          });
        },
      });
      if (shouldNotBeIgnored) {
        path.traverse({
          StringLiteral(path) {
            if (!isVisited(visitedNodePaths, path)) {
              if (path.getPathLocation().includes('alternate') || path.getPathLocation().includes('consequent')) {
                if (exports.cleanUpExtractedString(path.node.extra.rawValue).length !== 0) {
                  opts.conditionalExpressionNodeProcessor(
                    path,
                    opts.processedObject,
                    isAnExpression,
                  );
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
          },
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
              }
            },
            JSXIdentifier(path) {
              if (shouldBeIgnored(path)) {
                shouldNotIgnorePath = false;
              }
            },
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
              },
            });
          }
        },
      });
    },
    VariableDeclaration(path) {
      let shouldNotBeIgnored = true;
      path.traverse({
        Identifier(path) {
          if (shouldBeIgnored(path)) {
            shouldNotBeIgnored = false;
          }
        },
        JSXIdentifier(path) {
          if (shouldBeIgnored(path)) {
            shouldNotBeIgnored = false;
          }
        },
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
              },
            });
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
              },
            });
          },
        });
      }
    },
    CallExpression(path) {
      let shouldNotBeIgnored = true;
      path.traverse({
        Identifier(path) {
          if (shouldBeIgnored(path)) {
            shouldNotBeIgnored = false;
          }
        },
        JSXIdentifier(path) {
          if (shouldBeIgnored(path)) {
            shouldNotBeIgnored = false;
          }
        },
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
          },
        });
      }
    },
    Function(path) {
      if (path.node.key != null
        && (path.node.key.name === 'calculateKeyboardType'
          || path.node.key.name === 'processOutgoingValue'
          || path.node.key.name === 'getBackgroundColors')) {
        return;
      }
      path.traverse({
        ReturnStatement(path) {
          let shouldNotBeIgnored = true;

          path.traverse({
            Identifier(path) {
              if (shouldBeIgnored(path)) {
                shouldNotBeIgnored = false;
              }
            },
            JSXIdentifier(path) {
              if (shouldBeIgnored(path)) {
                shouldNotBeIgnored = false;
              }
            },
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
              },
            });
          }
        },
      });
    },
  };

  babelTraverse.default(opts.parsedTree, astVisitors);

  return opts.processedObject;
};

exports.writeImportStatementToJSContent = (jsFileContent) => {
  if (jsFileContent.includes('import I18n')) {
    return jsFileContent;
  }
  const fileLines = jsFileContent.split('\n');
  for (let index = fileLines.length - 1; index >= 0; index -= 1) {
    if (fileLines[index].startsWith('import')) {
      fileLines.splice(index + 1, 0, 'import I18n from "../services/internationalizations/i18n";');
      break;
    }
  }
  const result = fileLines.join('\n');
  return result;
};

const getParsedTree = (jsFileContent) => {
  const parseTree = babelParser.parse(jsFileContent, {
    presets: ['@babel/preset-react'],
    plugins: ['@babel/plugin-proposal-class-properties'],
  });
  return parseTree;
};

exports.extractStrings = (jsFileContent) => {
  const parser = new Parser();
  parser.jsContent = jsFileContent;
  const nodeProcessors = {
    parsedTree: parser.getParsedTree(jsFileContent),
    processedObject: [],
    jsxTextNodeProcessor(path, extractedStringsWithTypeAndPath) {
      const nodePath = getNodePath(path);
      extractedStringsWithTypeAndPath.push(
        constructStringObject(nodePath, path.node.value.toString(), JSX_TEXT_TYPE),
      );
    },

    jsxExpressionContainerNodeProcessor(path, extractedStringsWithTypeAndPath) {
      const nodePath = getNodePath(path);
      extractedStringsWithTypeAndPath.push(
        constructStringObject(nodePath, path.node.extra.rawValue, JSX_EXPRESSION_TYPE),
      );
    },

    jsxTitleAttributeNodeProcessor(path, extractedStringsWithTypeAndPath) {
      const nodePath = getNodePath(path);
      extractedStringsWithTypeAndPath.push(
        constructStringObject(nodePath, path.node.extra.rawValue, JSX_ATTRIBUTE_TYPE),
      );
    },
    templateElementNodeProcessor(path, extractedStringsWithTypeAndPath) {
      const nodePath = getNodePath(path);
      extractedStringsWithTypeAndPath.push(
        constructStringObject(nodePath, path.node.value.raw, TEMPLATE_ELEMENT),
      );
    },
    conditionalExpressionNodeProcessor(path, extractedStringsWithTypeAndPath) {
      const nodePath = getNodePath(path);
      extractedStringsWithTypeAndPath.push(
        constructStringObject(nodePath, path.node.extra.rawValue, CONDITIONAL_EXPRESSION_TYPE),
      );
    },
    objectPropertyNodeProcessor(path, extractedStringsWithTypeAndPath) {
      const nodePath = getNodePath(path);
      extractedStringsWithTypeAndPath.push(
        constructStringObject(nodePath, path.node.extra.rawValue, OBJECT_PROPERTY_TYPE),
      );
    },
    callExpressionNodeProcessor(path, extractedStringsWithTypeAndPath) {
      const nodePath = path.getPathLocation().replace(/\[([0-9]*)\]/gm, '.$1');
      extractedStringsWithTypeAndPath.push(
        constructStringObject(nodePath, path.node.extra.rawValue, CALL_EXPRESSION_TYPE),
      );
    },
    returnExpressionNodeProcessor(path, extractedStringsWithTypeAndPath) {
      const nodePath = path.getPathLocation().replace(/\[([0-9]*)\]/gm, '.$1');
      extractedStringsWithTypeAndPath.push(
        constructStringObject(nodePath, path.node.extra.rawValue, RETURN_EXPRESSION_TYPE),
      );
    },
  };
  const traverser = new Traverser(nodeProcessors, {});
  return traverser.traverseAndProcessAbstractSyntaxTree();
  // return traverseAndProcessAbstractSyntaxTree(jsFileContent, nodeProcessors);
};

const writeToFile = (jsFileName, newFileContent) => {
  fs.writeFileSync(jsFileName, newFileContent.code);
};

function createReplacementCasesHandlers(parsedTree, extractedStringsWithKeyAndPath) {
  const nodeProcessors = {
    parsedTree,
    processedObject: extractedStringsWithKeyAndPath,
    jsxTextNodeProcessor(path, extractedStringsWithKeyAndPath) {
      path.node.value = `{I18n.t("${extractedStringsWithKeyAndPath[0].key}")}`;
      extractedStringsWithKeyAndPath.shift();
    },
    jsxExpressionContainerNodeProcessor(path, extractedStringsWithKeyAndPath) {
      path.node.extra.raw = `I18n.t("${extractedStringsWithKeyAndPath[0].key}")`;
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
      path.node.value.raw = `\${I18n.t("${extractedStringsWithKeyAndPath[0].key}")}`;
      extractedStringsWithKeyAndPath.shift();
    },
    conditionalExpressionNodeProcessor(path, extractedStringsWithKeyAndPath) {
      path.node.extra.raw = `I18n.t("${extractedStringsWithKeyAndPath[0].key}")`;
      extractedStringsWithKeyAndPath.shift();
    },
    objectPropertyNodeProcessor(path, extractedStringsWithKeyAndPath) {
      path.node.extra.raw = `I18n.t("${extractedStringsWithKeyAndPath[0].key}")`;
      extractedStringsWithKeyAndPath.shift();
    },
    callExpressionNodeProcessor(path, extractedStringsWithKeyAndPath) {
      path.node.extra.raw = `I18n.t("${extractedStringsWithKeyAndPath[0].key}")`;
      extractedStringsWithKeyAndPath.shift();
    },
    returnExpressionNodeProcessor(path, extractedStringsWithKeyAndPath) {
      path.node.extra.raw = `I18n.t("${extractedStringsWithKeyAndPath[0].key}")`;
      extractedStringsWithKeyAndPath.shift();
    },
  };
  return nodeProcessors;
}

function generateNewFileContent(parsedTree, fileContent) {
  return babelGenerator.default(parsedTree, { sourceMap: true }, fileContent);
}

function createNewJSFileFromTree(parsedTree, fileContent, jsFilePath) {
  const newFileContent = generateNewFileContent(parsedTree, fileContent);
  writeToFile(jsFilePath, newFileContent);
  return newFileContent;
}

exports.replaceStringsWithKeys = (fileContent, jsFileName, jsonFileName, jsFilePath = `output/${jsFileName}`) => {
  const extractedStrings = exports.extractStrings(fileContent);
  const extractedStringsWithKeyAndPath = exports.writeToJsonFile(
    jsonFileName,
    jsFileName,
    extractedStrings,
  );
  const parsedTree = getParsedTree(fileContent);
  if (!extractedStrings.length) {
    return fileContent;
  }
  const nodeProcessors = createReplacementCasesHandlers(parsedTree, extractedStringsWithKeyAndPath);

  const traverser = new Traverser(nodeProcessors, {});
  traverser.traverseAndProcessAbstractSyntaxTree();

  // traverseAndProcessAbstractSyntaxTree(fileContent, nodeProcessors);
  const newFileContent = createNewJSFileFromTree(parsedTree, fileContent, jsFilePath);
  return newFileContent.code;
};

const getJsonDictObject = (jsonFileName) => {
  const fileContent = exports.readJsFileContent(jsonFileName);
  return JSON.parse(fileContent);
};

exports.writeToJsonFile = (jsonFileName, jsFileName, extractedStrings) => {
  const extractedStringsWithKeyAndPath = [];
  const jsonFileContent = getJsonDictObject(jsonFileName);
  const jsxTypeCount = {};

  for (let index = 0; index < extractedStrings.length; index += 1) {
    if (extractedStrings[index].type in jsxTypeCount) {
      jsxTypeCount[extractedStrings[index].type] += 1;
    } else {
      jsxTypeCount[extractedStrings[index].type] = 1;
    }
    insertNewEntryInJsonObject(
      jsFileName,
      extractedStrings,
      index,
      jsonFileContent,
      extractedStringsWithKeyAndPath,
      jsxTypeCount[extractedStrings[index].type],
    );
  }

  writeToJsonFileWithIndentation(jsonFileName, jsonFileContent);
  return extractedStringsWithKeyAndPath;
};

exports.readJsFileContent = jsFileName => fs.readFileSync(jsFileName, 'utf8');

exports.cleanUpExtractedString = (extractedString) => {
  if (extractedString === ':') {
    return '';
  }
  return extractedString.replace(/[\t\n]+/gm, ' ').trim();
};
