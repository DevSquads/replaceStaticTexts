/* globals describe it afterEach before after */
/* eslint no-template-curly-in-string: 0
          prefer-destructuring: 0
*/


const expect = require('chai').expect;
const fs = require('fs');
const parser = require('../parse');
const Parser = require('../Parser');
const Traverser = require('../Traverser');
const NodeProcessors = require('../NodeProcessors');

const parserObject = new Parser();
const jsonTestFileName = 'test.json';
const jsTestFileName = 'test.js';
const JS_TEST_FILE_NAME = 'TestScreen.js';

const getOriginalFileContent = (renderContent, classAttributeText = '') => `${'import React from "react";\n'
  + 'class TestClass extends React.Component {\n'
  + classAttributeText
  + '  render() {\n'
  + '    return (\n'}${
    renderContent
    }    );\n`
  + '  }\n'
  + '}';

const getModifiedFileContent = (modifiedRenderContent, modifiedClassAttributeText = '') => `${'import React from "react";\n'
  + 'import I18n from "../services/internationalizations/i18n";\n\n'
  + 'class TestClass extends React.Component {\n'
  + modifiedClassAttributeText
  + '  render() {\n'}${
    modifiedRenderContent
    }  }\n`
  + '\n'
  + '}';

function testParsedFileWithExpectedContent(originalInput, expectedOutput) {
  // const originalInput = getOriginalFileContent(originalRenderContent);
  // const expectedOutput = getModifiedFileContent(expectedRenderContent);

  fs.writeFileSync(jsonTestFileName, '{}');

  let jsFileContentWithReplacedKeys = parser
    .replaceStringsWithKeys(originalInput,
      JS_TEST_FILE_NAME, jsonTestFileName);
  parserObject.jsContent = jsFileContentWithReplacedKeys;
  jsFileContentWithReplacedKeys = parserObject.writeImportStatementToJSContent();

  expect(jsFileContentWithReplacedKeys).to.eql(expectedOutput);
}

describe('Extract And Replace Script', () => {

  afterEach(() => {
    if (fs.existsSync(jsonTestFileName)) {
      fs.unlinkSync(jsonTestFileName);
    }
    if (fs.existsSync(jsTestFileName)) {
      fs.unlinkSync(jsTestFileName);
    }
  });

  before(() => {
    if (!fs.existsSync('output')) {
      fs.mkdirSync('output');
    }
  });

  after(() => {
    const files = fs.readdirSync('output');
    for (let i = 0; i < files.length; i += 1) {
      fs.unlinkSync(`output/${files[i]}`);
    }
    fs.rmdirSync('output');
    if (fs.existsSync(JS_TEST_FILE_NAME)) {
      fs.unlinkSync(JS_TEST_FILE_NAME);
    }
  });

  describe('Extracting', () => {
    it('should extract a string inside a Text component from a js file inside a render function', () => {
      const jsFileContent = 'import React from "react";'
        + 'class TestClass extends React.Component {'
        + '  render() {'
        + '    return ('
        + '          <Text>Hello, world!</Text>'
        + '    );'
        + '  }'
        + '}';
      const parseTree = parser.getParsedTree(jsFileContent);
      const nodeProcessors = NodeProcessors.createExtractCasesHandlers(parseTree, {});
      const returnedStrings = new Traverser(nodeProcessors).traverseAndProcessAbstractSyntaxTree();

      expect(returnedStrings.length).to.eql(1);
      expect(returnedStrings[0]).to.eql({
        path: 'program.body.1.body.body.0.body.body.0.argument.children.0',
        type: 'JSXText',
        value: 'Hello, world!',
      });
    });
    it('should extract strings inside a js file inside a render function', () => {
      const originalFileContentWithJSXText = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '      <Text>Hello, world!</Text>\n'
        + '      <View><Text>Another Text</Text></View>\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';

      const parseTree = parser.getParsedTree(originalFileContentWithJSXText);
      const nodeProcessors = NodeProcessors.createExtractCasesHandlers(parseTree, {});
      const returnedStrings = new Traverser(nodeProcessors).traverseAndProcessAbstractSyntaxTree();

      expect(returnedStrings.length).to.eql(2);
      expect(returnedStrings[0]).to.eql({
        path: 'program.body.1.body.body.0.body.body.0.argument.children.1.children.0',
        type: 'JSXText',
        value: 'Hello, world!',
      });
      expect(returnedStrings[1]).to.eql({
        path: 'program.body.1.body.body.0.body.body.0.argument.children.3.children.0.children.0',
        type: 'JSXText',
        value: 'Another Text',
      });
    });
    it('should retrieve texts inside title prop', () => {
      const originalFileContentWithATitleProp = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '   {someCondition && console.log(\'test\')}'
        + '      <Text style={"center"} title={"TEST_TITLE"}>{"Hello, world!"}</Text>\n'
        + '      <View><Text>{"Another Text"}</Text></View>\n'
        + '      {120}\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');
      // const parseTree = parser.getParsedTree(originalFileContentWithATitleProp);
      // const nodeProcessors = NodeProcessors.createExtractCasesHandlers(parseTree, {});
      // const extractedStrings = new Traverser(nodeProcessors).traverseAndProcessAbstractSyntaxTree();
      const extractedStrings = parser.extractStrings(originalFileContentWithATitleProp);

      expect(extractedStrings).to.deep.contain({
        path: 'program.body.1.body.body.0.body.body.0.argument.children.3.openingElement.attributes.1.expression',
        type: 'JSXAttribute',
        value: 'TEST_TITLE',
      });
    });
    it('should retrieve texts inside errMessage prop', () => {
      const originalFileContentWithErrorMessageProp = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '   {someCondition && console.log(\'test\')}'
        + '      <Text style={"center"} errMessage={"TEST_errMessage"}>{"Hello, world!"}</Text>\n'
        + '      <View><Text>{"Another Text"}</Text></View>\n'
        + '      {120}\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      const extractedStrings = parser.extractStrings(originalFileContentWithErrorMessageProp);

      expect(extractedStrings).to.deep.contain({
        path: 'program.body.1.body.body.0.body.body.0.argument.children.3.openingElement.attributes.1.expression',
        type: 'JSXAttribute',
        value: 'TEST_errMessage',
      });
    });
    it('should retrieve texts inside content prop', () => {
      const originalFileContentWithAContentProp = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '   {someCondition && console.log(\'test\')}'
        + '      <Text style={"center"} content={"TEST_TITLE"}>{"Hello, world!"}</Text>\n'
        + '      <View><Text>{"Another Text"}</Text></View>\n'
        + '      {120}\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      const extractedStrings = parser.extractStrings(originalFileContentWithAContentProp);

      expect(extractedStrings).to.deep.contain({
        path: 'program.body.1.body.body.0.body.body.0.argument.children.3.openingElement.attributes.1.expression',
        type: 'JSXAttribute',
        value: 'TEST_TITLE',
      });
    });
    it('should retrieve texts inside placeholder/tip/errorMessage prop', () => {
      const originalFileContentWithAPlaceholderProp = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '   {someCondition && console.log(\'test\')}'
        + '      <Text style={"center"} placeholder={"TEST_PLACEHOLDER"}>{"Hello, world!"}</Text>\n'
        + '      <Text style={"center"} tip={"TEST_tip"}>{"Hello, world!"}</Text>\n'
        + '      <Text style={"center"} errorMessage={"TEST_errorMessage"}>{"Hello, world!"}</Text>\n'

        + '      <View><Text>{"Another Text"}</Text></View>\n'
        + '      {120}\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      const extractedStrings = parser.extractStrings(originalFileContentWithAPlaceholderProp);

      expect(extractedStrings).to.deep.contain(
        {
          path: 'program.body.1.body.body.0.body.body.0.argument.children.3.openingElement.attributes.1.expression',
          type: 'JSXAttribute',
          value: 'TEST_PLACEHOLDER',
        },
        {
          path: 'program.body.1.body.body.0.body.body.0.argument.children.3.openingElement.attributes.1.expression',
          type: 'JSXAttribute',
          value: 'TEST_tip',
        }, {
          path: 'program.body.1.body.body.0.body.body.0.argument.children.3.openingElement.attributes.1.expression',
          type: 'JSXAttribute',
          value: 'TEST_errormessage',
        },
      );
    });
    it('should not retrieve text inside a style expression', () => {
      const originalFileContentWithAStyleExpression = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '   {someCondition && console.log(\'test\')}'
        + '      <Text style={"center"}>{"Hello, world!"}</Text>\n'
        + '      <View><Text>{"Another Text"}</Text></View>\n'
        + '      {120}\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      const extractedStrings = parser.extractStrings(originalFileContentWithAStyleExpression);

      expect(extractedStrings).to.not.deep.contain({
        path: 'program.body.1.body.body.0.body.body.0.argument.children.3.openingElement.attributes.0.expression.value',
        type: 'JSXExpressionContainer',
        value: 'center',
      });
    });
    it('should retrieve text without indentation', () => {
      const originalFileContentWithATitleProp = 'import React from "react";\n'
        + 'import util from "utils";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '      <Text>\n'
        + '           Hello, world!\n'
        + '      </Text>\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      const extractedStrings = parser.extractStrings(originalFileContentWithATitleProp);

      expect(extractedStrings).to.deep.contain({
        path: 'program.body.2.body.body.0.body.body.0.argument.children.1.children.0',
        type: 'JSXText',
        value: 'Hello, world!',
      });
    });
  });

  describe('Write I18n import statement', () => {
    it('should write import statement to the beginning of js file', () => {
      const originalJsFileContent = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '          <Text>Hello, world!</Text>\n'
        + '    );\n'
        + '  }\n'
        + '}';
      const expectedJsFileContent = 'import React from "react";\n'
        + 'import I18n from "../services/internationalizations/i18n";\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return <Text>{I18n.t("TestScreen.JSXText.index(0)")}</Text>;\n'
        + '  }\n\n'
        + '}';
      fs.writeFileSync(JS_TEST_FILE_NAME, originalJsFileContent);
      fs.writeFileSync(jsonTestFileName, '{}');


      let jsFileContentWithImportStatement = parser.replaceStringsWithKeys(
        originalJsFileContent,
        JS_TEST_FILE_NAME,
        jsonTestFileName,
      );
      parserObject.jsContent = jsFileContentWithImportStatement;
      jsFileContentWithImportStatement = parserObject.writeImportStatementToJSContent();
      expect(jsFileContentWithImportStatement).to.eql(expectedJsFileContent);
    });

    it('should insert import I8n statement in the JS file', () => {
      const originalFileContent = 'import React from "react";\n\n'
        + '//comment\n'
        + 'import {View} from "react-native";\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '      <Text>Hello, world!</Text>\n'
        + '      <View><Text>Another Text</Text></View>\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';
      const expectedFileContent = 'import React from "react";\n\n'
        + '//comment\n'
        + 'import {View} from "react-native";\n'
        + 'import I18n from "../services/internationalizations/i18n";\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '      <Text>Hello, world!</Text>\n'
        + '      <View><Text>Another Text</Text></View>\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';

      parserObject.jsContent = originalFileContent;
      const fileContentWithI18nImportStatement = parserObject.writeImportStatementToJSContent();

      expect(fileContentWithI18nImportStatement).to.eql(expectedFileContent);
    });

    it('should not insert an import statement if one already exists', () => {
      const originalFileContent = 'import React from "react";\n'
        + 'import I18n from "../services/internationalizations/i18n";\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return <Text></Text>;\n'
        + '  }\n\n'
        + '}';

      fs.writeFileSync(jsonTestFileName, '{}');

      let actualFileContent = parser
        .replaceStringsWithKeys(originalFileContent,
          JS_TEST_FILE_NAME, jsonTestFileName);
      parserObject.jsContent = actualFileContent;
      actualFileContent = parserObject.writeImportStatementToJSContent();

      expect(actualFileContent).to.eql(originalFileContent);
    });
  });

  describe('Add extracted texts to JSON file', () => {
    it('should write to json file with correct key', () => {
      fs.writeFileSync(jsonTestFileName, '{}');
      const testExtractedStrings = [{
        type: 'JSXText',
        value: 'Hello, world!',
      }];

      parser.writeToJsonFile(jsonTestFileName, 'TestScreen', testExtractedStrings);

      expect(fs.existsSync(jsonTestFileName));
      const jsonFileContent = fs.readFileSync(jsonTestFileName, 'utf8');
      expect(jsonFileContent).to.eql('{\n    "TestScreen.JSXText.index(0)": "Hello, world!"\n}');
    });
    it('should write to json file with correct key case 2', () => {
      fs.writeFileSync(jsonTestFileName, '{\n"AnotherTestScreen.JSXText.index(0)": "Just another text"\n}');
      const testExtractedStrings = [{
        path: 'just.a.test.path',
        type: 'JSXText',
        value: 'Hello, world!',
      }];

      const keysAndPathsOfExtractedStrings = parser
        .writeToJsonFile(jsonTestFileName,
          JS_TEST_FILE_NAME, testExtractedStrings);

      expect(keysAndPathsOfExtractedStrings[0]).to.eql({
        path: 'just.a.test.path',
        key: 'TestScreen.JSXText.index(0)',
        value: 'Hello, world!',
      });
      const fileExists = fs.existsSync(jsonTestFileName);
      expect(fileExists).to.eql(true);
      const jsonFileContent = fs.readFileSync(jsonTestFileName, 'utf8');
      expect(jsonFileContent).to.eql('{\n    "AnotherTestScreen.JSXText.index(0)": "Just another text",\n   '
        + ' "TestScreen.JSXText.index(0)": "Hello, world!"\n}');
    });
  });

  describe('Replacement Unhappy Cases', () => {
    it('should not throw an exception when a non literal string expression container is met', () => {
      const originalFileContentWithANonLiteralStringContainer = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '   {someCondition && console.log(\'test\')}'
        + '      <Text>{"Hello, world!"}</Text>\n'
        + '      <View><Text>{"Another Text"}</Text></View>\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');
      fs.writeFileSync(JS_TEST_FILE_NAME, '');

      expect(() => {
        parser
          .replaceStringsWithKeys(originalFileContentWithANonLiteralStringContainer,
            JS_TEST_FILE_NAME, jsonTestFileName);
      }).to.not.throw();
    });

    it('should not throw an exception when an expression with a non string value is met', () => {
      const originalFileContentWithANonLiteralStringContainer = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '   {someCondition && console.log(\'test\')}'
        + '      <Text>{"Hello, world!"}</Text>\n'
        + '      <View><Text>{"Another Text"}</Text></View>\n'
        + '      {120}\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      expect(() => {
        parser
          .replaceStringsWithKeys(originalFileContentWithANonLiteralStringContainer,
            JS_TEST_FILE_NAME, jsonTestFileName);
      }).to.not.throw();
    });

    it('should not throw an exception when there is no strings to extract', () => {
      const originalFileContentWithNoStringsToRetrieve = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      expect(() => {
        parser
          .replaceStringsWithKeys(originalFileContentWithNoStringsToRetrieve,
            JS_TEST_FILE_NAME, jsonTestFileName);
      }).to.not.throw();
    });

    it('should not throw an exception when faced with an empty expression', () => {
      const originalFileContentWithASelfClosingElement = 'import React from "react";\n'
        + 'import I18n from "../services/internationalizations/i18n";\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '       {" "}\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      expect(() => {
        parser.replaceStringsWithKeys(originalFileContentWithASelfClosingElement,
          JS_TEST_FILE_NAME, jsonTestFileName);
      }).to.not.throw();
    });

    it('should not replace style values', () => {
      const fileContentWithStyleValues = 'import React from "react";\n'
        + 'const styles = StyleSheet.create({\n'
        + '  button: {\n'
        + '    justifyContent: "center"\n'
        + '  }\n'
        + '});\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {}\n\n'
        + '}';
      fs.writeFileSync('output/TestScreen.js', fileContentWithStyleValues);
      fs.writeFileSync(jsonTestFileName, '{}');

      const jsFileContentWithoutKeys = parser
        .replaceStringsWithKeys(fileContentWithStyleValues,
          JS_TEST_FILE_NAME, jsonTestFileName);

      expect(jsFileContentWithoutKeys).to.eql(fileContentWithStyleValues);
    });
    it('should not replace text in dimensions function call ', () => {
      const fileContentWithDimensionFunction = 'import React from "react";\n'
        + 'const width = Dimensions.get("window");\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return <View></View>;\n'
        + '  }\n\n'
        + '}';
      fs.writeFileSync('output/TestScreen.js', fileContentWithDimensionFunction);
      fs.writeFileSync(jsonTestFileName, '{}');

      const jsFileContentWithoutKeys = parser
        .replaceStringsWithKeys(fileContentWithDimensionFunction,
          JS_TEST_FILE_NAME, jsonTestFileName);

      expect(jsFileContentWithoutKeys).to.eql(fileContentWithDimensionFunction);
    });
    it('should not replace texts inside require statement', () => {
      const originalFileContentWithARequireStatement = 'import React from "react";\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return <Image source={fillLeftFoot ? require("../../../assets/feet/left-foot-solid-full.png") : require("../../../assets/feet/left-foot-solid-empty.png")} />;\n'
        + '  }\n\n'
        + '}';
      fs.writeFileSync('output/TestScreen.js', originalFileContentWithARequireStatement);
      fs.writeFileSync(jsonTestFileName, '{}');

      const modifiedFileContentWithoutKeys = parser
        .replaceStringsWithKeys(originalFileContentWithARequireStatement,
          JS_TEST_FILE_NAME, jsonTestFileName);

      expect(modifiedFileContentWithoutKeys).to.eql(originalFileContentWithARequireStatement);
    });
    it('should ignore text in emoji function call ', () => {
      fs.writeFileSync(jsonTestFileName, '{}');
      const fileContentWithIgnoredCases = 'import React from "react";\n'
        + 'const ignoredCase1 = StyleSheet.get("smiley");\n'
        + 'const ignoredCase2 = Dimensions.get("smiley");\n'
        + 'const ignoredCase3 = emoji.get("smiley");\n'
        + 'const ignoredCase4 = object.setDrawerEnabled("smiley");\n'
        + 'const ignoredCase5 = OS.get("smiley");\n'
        + 'const ignoredCase6 = moment.get("smiley");\n'
        + 'const ignoredCase7 = utcMoment.get("smiley");\n'
        + 'const ignoredCase8 = OS.handleChangedInput("string");\n'
        + 'const ignoredCase9 = OS.addEventListener("string");\n'
        + 'const ignoredCase10 = OS.removeEventListener("string");\n'
        + 'const ignoredCase11 = OS.PropTypes("string");\n\n'
        + 'const aComponent = () => {\n'
        + '  <View style={{\n'
        + '    color: "white"\n'
        + '  }}></View>;\n'
        + '};\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return <View>{config.someCondition === "text" && <Text></Text>}</View>;\n'
        + '  }\n\n'
        + '}';
      fs.writeFileSync('output/TestScreen.js', fileContentWithIgnoredCases);

      const modifiedFileContentWithoutKeys = parser
        .replaceStringsWithKeys(fileContentWithIgnoredCases,
          JS_TEST_FILE_NAME, jsonTestFileName);

      expect(modifiedFileContentWithoutKeys).to.eql(fileContentWithIgnoredCases);
    });

    it('should ignore text in flexDirection style call ', () => {
      fs.writeFileSync(jsonTestFileName, '{}');
      const fileContentWithIgnoredCases = 'import React from "react";\n'
        + '<View style={{\n'
        + '  color: "white"\n'
        + '}}></View>;\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    const flexDirection = mission.status === "RECOMMENDED" || mission.status === "SKIPPED" ? "text1" : "text2";\n'
        + '  }\n\n'
        + '}';
      fs.writeFileSync('output/TestScreen.js', fileContentWithIgnoredCases);

      const modifiedFileContentWithoutKeys = parser
        .replaceStringsWithKeys(fileContentWithIgnoredCases,
          JS_TEST_FILE_NAME, jsonTestFileName);

      expect(modifiedFileContentWithoutKeys).to.eql(fileContentWithIgnoredCases);
    });

    it('should not extract text inside an I18n function call', () => {
      const originalFileContent = 'import React from "react";\n'
        + 'import I18n from "../services/internationalizations/i18n";\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  constructor() {\n'
        + '    return I18n.t("TestScreen.ReturnExpression.index(0)");\n'
        + '  }\n\n'
        + '  render() {\n'
        + '    return <View title={I18n.t("TestScreen.JSXAttribute.index(0)")}></View>\n'
        + '  }\n\n'
        + '}';

      fs.writeFileSync(jsonTestFileName, '{}');

      let actualFileContent = parser
        .replaceStringsWithKeys(originalFileContent,
          JS_TEST_FILE_NAME, jsonTestFileName);
      parserObject.jsContent = actualFileContent;
      actualFileContent = parserObject.writeImportStatementToJSContent();
      expect(actualFileContent).to.eql(originalFileContent);
    });
  });

  describe('Replacement', () => {
    it('should read a js file', () => {
      const jsFileContent = 'Hello, world!';
      fs.writeFileSync(jsTestFileName, jsFileContent);

      const fileContent = parser.readJsFileContent(jsTestFileName);

      expect(fileContent).to.eql(jsFileContent);

      fs.unlinkSync(jsTestFileName);
    });

    it('should clean up the extracted string from all tabs and newlines', () => {
      const returnedString = parser.cleanUpExtractedString('\t\tTest\n\t\tString\n');
      expect(returnedString).to.eql('Test String');
    });

    it('should replace the extracted JSXText strings with generated key', () => {
      const originalRenderContent = '    <View>\n'
        + '      <Text>Hello, world!</Text>\n'
        + '      <View><Text>Another Text</Text></View>\n'
        + '    </View>\n';
      const expectedRenderContent = '    return <View>\n'
        + '      <Text>{I18n.t("TestScreen.JSXText.index(0)")}</Text>\n'
        + '      <View><Text>{I18n.t("TestScreen.JSXText.index(1)")}</Text></View>\n'
        + '    </View>;\n';

      testParsedFileWithExpectedContent(getOriginalFileContent(originalRenderContent), getModifiedFileContent(expectedRenderContent));
    });

    it('should replace the extracted ExpressionText strings with generated key', () => {
      const originalRenderContent = '    <View>\n'
        + '      <Text>{"Hello, world!"}</Text>\n'
        + '      <View><Text>{"Another Text"}</Text></View>\n'
        + '    </View>\n';
      const expectedRenderContent = '    return <View>\n'
        + '      <Text>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n'
        + '      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n'
        + '    </View>;\n';


      testParsedFileWithExpectedContent(getOriginalFileContent(originalRenderContent), getModifiedFileContent(expectedRenderContent));
    });

    it('should replace texts inside title prop with an expression', () => {
      const originalRenderContent = '    <View>\n'
        + '   {someCondition && this.someCommand}\n'
        + '      <Text style={"center"} title={"TEST_TITLE"}>{"Hello, world!"}</Text>\n'
        + '      <View><Text>{"Another Text"}</Text></View>\n'
        + '      {120}\n'
        + '    </View>\n';
      const expectedRenderContent = '    return <View>\n'
        + '   {someCondition && this.someCommand}\n'
        + '      <Text style={"center"} title={I18n.t("TestScreen.JSXAttribute.index(0)")}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n'
        + '      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n'
        + '      {120}\n'
        + '    </View>;\n';

      testParsedFileWithExpectedContent(getOriginalFileContent(originalRenderContent), getModifiedFileContent(expectedRenderContent));
    });

    it('should replace texts inside title prop without an expression', () => {
      const originalRenderContent = '    <View>\n'
        + '   {someCondition && this.someCommand}\n'
        + '      <Text style={"center"} title="TEST_TITLE">{"Hello, world!"}</Text>\n'
        + '      <View><Text>{"Another Text"}</Text></View>\n'
        + '      {120}\n'
        + '    </View>\n';
      const expectedRenderContent = '    return <View>\n'
        + '   {someCondition && this.someCommand}\n'
        + '      <Text style={"center"} title={I18n.t("TestScreen.JSXAttribute.index(0)")}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n'
        + '      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n'
        + '      {120}\n'
        + '    </View>;\n';

      testParsedFileWithExpectedContent(getOriginalFileContent(originalRenderContent), getModifiedFileContent(expectedRenderContent));
    });

    it('should replace texts inside an interpolated string', () => {
      const originalRenderContent = getOriginalFileContent('    <View>\n'
        + '   {someCondition && this.someCommand}\n'
        + '      <Text style={"center"} title={`Hey ${Omar} We Love you`}>{"Hello, world!"}</Text>\n'
        + '      <View><Text>{"Another Text"}</Text></View>\n'
        + '      {120}\n'
        + '    </View>\n');
      const expectedRenderContent = getModifiedFileContent('    return <View>\n'
        + '   {someCondition && this.someCommand}\n'
        + '      <Text style={"center"} '
        + 'title={`${I18n.t("TestScreen.TemplateElement.index(0)")}${Omar}${I18n.t("TestScreen.TemplateElement.index(1)")}`}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n'
        + '      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n'
        + '      {120}\n'
        + '    </View>;\n');

      testParsedFileWithExpectedContent(originalRenderContent, expectedRenderContent);
    });

    it('should replace texts inside conditional statement', () => {
      const originalClassAttributeText = '  someObject = someCondition ? [\'consequent text\'] : [\'alternate text\'];';
      const expectedClassAttributeText = '  someObject = someCondition ? [I18n.t("TestScreen.ConditionalExpression.index(0)")] : [I18n.t("TestScreen.ConditionalExpression.index(1)")];\n\n'

      const originalFileContentWithATitleProp = getOriginalFileContent('    <View></View>\n', originalClassAttributeText);
      const expectedFileContent = getModifiedFileContent('    return <View></View>;\n', expectedClassAttributeText);

      testParsedFileWithExpectedContent(originalFileContentWithATitleProp, expectedFileContent);
    });

    it('should replace title attribute inside object statement', () => {
      const originalWithAnAttributeInsideObject = getOriginalFileContent('   this.MODAL_CONTENT = {\n'
        + '       title: "Test title"\n'
        + '  }\n');

      const expectedContentWithAnAttributeInsideObject = getModifiedFileContent('    return this.MODAL_CONTENT = {\n'
        + '      title: I18n.t("TestScreen.ReturnExpression.index(0)")\n'
        + '    };\n');

      // const originalFileContentWithAnAttributeInsideObject = 'import React from "react";\n\n'
      //   + 'class TestClass extends React.Component {\n'
      //   + '  render() {\n'
      //
      //   + ' }\n'
      //   + '}';
      // const expectedFileContentWithAnAttributeInsideObject = 'import React from "react";\n'
      //   + 'import I18n from "../services/internationalizations/i18n";\n\n'
      //   + 'class TestClass extends React.Component {\n'
      //   + '  render() {\n'
      //   + '    this.MODAL_CONTENT = {\n'
      //   + '      title: I18n.t("TestScreen.ObjectProperty.index(0)")\n'
      //   + '    };\n'
      //   + '  }\n\n'
      //   + '}';

      testParsedFileWithExpectedContent(originalWithAnAttributeInsideObject, expectedContentWithAnAttributeInsideObject);
    });

    it('should replace texts inside state assignment statement', () => {
      const originalFileContentWithAStateAssignment = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n\n'
        + '  constructor() {\n'
        + '    this.state = {\n'
        + '      errors: {\n'
        + '        password: \'Some cool test string\'\n'
        + '      }\n'
        + '    }\n'
        + '  }\n\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View></View>\n'
        + '    );\n'
        + '  }\n\n'
        + '}';
      fs.writeFileSync(JS_TEST_FILE_NAME, originalFileContentWithAStateAssignment);
      const expectedFileContent = 'import React from "react";\n'
        + 'import I18n from "../services/internationalizations/i18n";\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  constructor() {\n'
        + '    this.state = {\n'
        + '      errors: {\n'
        + '        password: I18n.t("TestScreen.ObjectProperty.index(0)")\n'
        + '      }\n'
        + '    };\n'
        + '  }\n\n'
        + '  render() {\n'
        + '    return <View></View>;\n'
        + '  }\n\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      let jsFileContentWithReplacedKeys = parser
        .replaceStringsWithKeys(originalFileContentWithAStateAssignment,
          JS_TEST_FILE_NAME, jsonTestFileName);
      parserObject.jsContent = jsFileContentWithReplacedKeys;
      jsFileContentWithReplacedKeys = parserObject.writeImportStatementToJSContent();

      expect(jsFileContentWithReplacedKeys).to.eql(expectedFileContent);
    });

    it('should replace text in object declaration in side variable declaration ', () => {
      const originalfileContentWithVariableDeclaration = 'import React from "react";\n'
        + 'const darkGrayCopyOptions = [{\n'
        + '  A: "Small steps can get a revolution started!",\n'
        + '  B: "Starting with your mission today:"\n'
        + '}];\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return <View></View>;\n'
        + '  }\n\n'
        + '}';
      const expectedfileContentWithVariableDeclaration = 'import React from "react";\n'
        + 'import I18n from "../services/internationalizations/i18n";\n'
        + 'const darkGrayCopyOptions = [{\n'
        + '  A: I18n.t("TestScreen.ObjectProperty.index(0)"),\n'
        + '  B: I18n.t("TestScreen.ObjectProperty.index(1)")\n'
        + '}];\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return <View></View>;\n'
        + '  }\n\n'
        + '}';
      fs.writeFileSync(JS_TEST_FILE_NAME, originalfileContentWithVariableDeclaration);
      fs.writeFileSync(jsonTestFileName, '{}');

      let jsFileContentWithReplacedKeys = parser
        .replaceStringsWithKeys(originalfileContentWithVariableDeclaration,
          JS_TEST_FILE_NAME, jsonTestFileName);
      parserObject.jsContent = jsFileContentWithReplacedKeys;
      jsFileContentWithReplacedKeys = parserObject.writeImportStatementToJSContent();

      expect(jsFileContentWithReplacedKeys).to.eql(expectedfileContentWithVariableDeclaration);
    });

    it('should replace text in array declaration in side variable declaration ', () => {
      const originalfileContentWithVariableDeclaration = 'import React from "react";\n\n'
        + 'const firstCalibrationPhrases = ["First string", "Second string"];\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '   return <View></View>;\n'
        + '  }\n\n'
        + '}';
      const expectedfileContentWithVariableDeclaration = 'import React from "react";\n'
        + 'import I18n from "../services/internationalizations/i18n";\n'
        + 'const firstCalibrationPhrases = ['
        + 'I18n.t("TestScreen.ObjectProperty.index(0)"),'
        + ' I18n.t("TestScreen.ObjectProperty.index(1)")'
        + '];\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return <View></View>;\n'
        + '  }\n\n'
        + '}';
      fs.writeFileSync(JS_TEST_FILE_NAME, originalfileContentWithVariableDeclaration);
      fs.writeFileSync(jsonTestFileName, '{}');

      let jsFileContentWithReplacedKeys = parser
        .replaceStringsWithKeys(originalfileContentWithVariableDeclaration,
          JS_TEST_FILE_NAME, jsonTestFileName);
      parserObject.jsContent = jsFileContentWithReplacedKeys;
      jsFileContentWithReplacedKeys = parserObject.writeImportStatementToJSContent();

      expect(jsFileContentWithReplacedKeys)
        .to.eql(expectedfileContentWithVariableDeclaration);
    });

    // TODO What is it used for
    it('should put an evaluation curly bracket on prop value if it is inside inline conditional rendering', () => {
      const originalFileContentWithTextProp = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '     {anotherCondition && <Button style={"center"} title="TEST_TITLE" />}\n'
        + '      {120}\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';
      const expectedFileContent = 'import React from "react";\n'
        + 'import I18n from "../services/internationalizations/i18n";\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return <View>\n'
        + '     {anotherCondition && <Button style={"center"} title={I18n.t("TestScreen.JSXAttribute.index(0)")} />}\n'
        + '      {120}\n'
        + '    </View>;\n'
        + '  }\n\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      let modifiedContentWithTextProp = parser
        .replaceStringsWithKeys(originalFileContentWithTextProp,
          JS_TEST_FILE_NAME, jsonTestFileName);
      parserObject.jsContent = modifiedContentWithTextProp;
      modifiedContentWithTextProp = parserObject.writeImportStatementToJSContent();

      expect(modifiedContentWithTextProp).to.eql(expectedFileContent);
    });

    it('should not evaluate inside an evaluation expression', () => {
      const originalFileContentWithATitleProp = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '     {anotherCondition && <Text style={"center"} title={someCondition ? "TEST_TITLE" : "ANOTHER_TITLE"}>{"Hello, world!"}</Text> }\n'
        + '      {120}\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';
      const expectedFileContent = 'import React from "react";\n'
        + 'import I18n from "../services/internationalizations/i18n";\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return <View>\n'
        + '     {anotherCondition && <Text style={"center"} title={someCondition ? I18n.t("TestScreen.JSXAttribute.index(0)") : I18n.t("TestScreen.JSXAttribute.index(1)")}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>}\n'
        + '      {120}\n'
        + '    </View>;\n'
        + '  }\n\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      let modifiedContentWithEvaluationExpression = parser
        .replaceStringsWithKeys(originalFileContentWithATitleProp,
          JS_TEST_FILE_NAME, jsonTestFileName);
      parserObject.jsContent = modifiedContentWithEvaluationExpression;
      modifiedContentWithEvaluationExpression = parserObject.writeImportStatementToJSContent();

      expect(modifiedContentWithEvaluationExpression).to.eql(expectedFileContent);
    });


    // return `Today and tomorrow, this mission will appear on your calendar at this time:`;
    it('should replace literal text in return statement', () => {
      const originalJsWithReturnStatement = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '   return `Today and tomorrow, this mission will appear on your calendar at this time:`;\n'
        + ' }\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');
      const expectedFileContent = 'import React from "react";\n'
        + 'import I18n from "../services/internationalizations/i18n";\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return `${I18n.t("TestScreen.TemplateElement.index(0)")}`;\n'
        + '  }\n\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      let modifiedContentWithLiteralInReturnStatement = parser
        .replaceStringsWithKeys(originalJsWithReturnStatement,
          JS_TEST_FILE_NAME, jsonTestFileName);
      parserObject.jsContent = modifiedContentWithLiteralInReturnStatement;
      modifiedContentWithLiteralInReturnStatement = parserObject.writeImportStatementToJSContent();

      expect(modifiedContentWithLiteralInReturnStatement).to.eql(expectedFileContent);
    });

    it('should replace template literal text in return statement', () => {
      const originalJsWithLiteralInReturnStatement = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '   return `Today and tomorrow, ${this.test}  this mission will appear on your calendar at this time:`;\n'
        + ' }\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');
      const expectedFileContent = 'import React from "react";\n'
        + 'import I18n from "../services/internationalizations/i18n";\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return `${I18n.t("TestScreen.TemplateElement.index(0)")}${this.test}${I18n.t("TestScreen.TemplateElement.index(1)")}`;\n'
        + '  }\n\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      let modifiedContentWithLiteralInReturnStatement = parser
        .replaceStringsWithKeys(originalJsWithLiteralInReturnStatement,
          JS_TEST_FILE_NAME, jsonTestFileName);
      parserObject.jsContent = modifiedContentWithLiteralInReturnStatement;
      modifiedContentWithLiteralInReturnStatement = parserObject.writeImportStatementToJSContent();

      expect(modifiedContentWithLiteralInReturnStatement).to.eql(expectedFileContent);
    });

    it('should replace text inside method statement', () => {
      const originalJsWithReturnStatement = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  calculate() {\n'
        + '   return "Today and tomorrow, this mission will appear on your calendar at this time:";\n'
        + ' }\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');
      const expectedFileContent = 'import React from "react";\n'
        + 'import I18n from "../services/internationalizations/i18n";\n\n'
        + 'class TestClass extends React.Component {\n'
        + '  calculate() {\n'
        + '    return I18n.t("TestScreen.ReturnExpression.index(0)");\n'
        + '  }\n\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      let modifiedFileContentWithReturnStatement = parser
        .replaceStringsWithKeys(originalJsWithReturnStatement,
          JS_TEST_FILE_NAME, jsonTestFileName);
      parserObject.jsContent = modifiedFileContentWithReturnStatement;
      modifiedFileContentWithReturnStatement = parserObject.writeImportStatementToJSContent();

      expect(modifiedFileContentWithReturnStatement).to.eql(expectedFileContent);
    });

    // Why this test
    it('should not retrieve text in return statement of calculateKeyboardType', () => {
      const originalJsWithReturnStatement = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  calculateKeyboardType() {\n'
        + '    if (keyRepresentation === "idealWeight")\n'
        + '      return "Today and tomorrow, this mission will appear on your calendar at this time:";\n'
        + ' }\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');
      const expectedFileContent = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  calculateKeyboardType() {\n'
        + '    if (keyRepresentation === "idealWeight")\n'
        + '      return "Today and tomorrow, this mission will appear on your calendar at this time:";\n'
        + ' }\n'
        + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      const extractedStrings = parser
        .replaceStringsWithKeys(originalJsWithReturnStatement,
          JS_TEST_FILE_NAME, jsonTestFileName);

      expect(extractedStrings).to.eql(expectedFileContent);
    });
  });
});
