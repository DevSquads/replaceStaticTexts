const JSX_TEXT_TYPE = 'JSXText';
const JSX_EXPRESSION_TYPE = 'JSXExpressionContainer';
const JSX_ATTRIBUTE_TYPE = 'JSXAttribute';
const TEMPLATE_ELEMENT = 'TemplateElement';
const CONDITIONAL_EXPRESSION_TYPE = 'ConditionalExpression';
const OBJECT_PROPERTY_TYPE = 'ObjectProperty';
const CALL_EXPRESSION_TYPE = 'CallExpression';
const RETURN_EXPRESSION_TYPE = 'ReturnExpression';

const getNodePath = path => path.getPathLocation().replace(/\[([0-9]*)\]/gm, '.$1');
const cleanUpIndentation = extractedText => extractedText.replace(/^\n[\t ]{2,}/gm, '').replace(/\n[\t ]{2,}$/gm, '').replace(/\n[\t ]{2,}/gm, '\n');

const constructStringObject = (textKey, extractedText, stringType) => ({
  path: textKey.replace('.value', ''),
  type: stringType,
  value: cleanUpIndentation(extractedText),
});

exports.createExtractCasesHandlers = (parsedTree) => {
  return {
    parsedTree,
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
};
exports.createReplacementCasesHandlers = (parsedTree, extractedStringsWithKeyAndPath) => {
  return {
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
};
