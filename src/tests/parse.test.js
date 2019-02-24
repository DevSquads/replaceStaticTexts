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
});
