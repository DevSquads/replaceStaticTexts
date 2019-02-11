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
