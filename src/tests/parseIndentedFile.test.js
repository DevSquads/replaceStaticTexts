/* globals describe it afterEach before after */
/* eslint no-template-curly-in-string: 0
          prefer-destructuring: 0
*/

const expect = require('chai').expect;
const path = require('path');
const fs = require('fs');
const parser = require('../parse');
const Parser = require('../Parser');


describe('Parser Indented Files', () => {

  const parserObject = new Parser();


  const jsonTestFileName = 'test.json';
  const jsTestFileName = 'test.js';
  const JS_TEST_FILE_NAME = 'TestScreen.js';
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


  xit('should keep the indentation of "return" block ', () => {
    const originalFileContentWithATitleProp = 'import React from "react";\n'
      + 'class TestClass extends React.Component {\n'
      + '  render() {\n'
      + '    return (\n'
      + '    <View>\n'
      + '   {someCondition && this.someCommand}\n'
      + '      <Text style={"center"} title={"TEST_TITLE"}>{"Hello, world!"}</Text>\n'
      + '      <View><Text>{"Another Text"}</Text></View>\n'
      + '      {120}\n'
      + '    </View>\n'
      + '    );\n'
      + '  }\n'
      + '}';
    fs.writeFileSync(JS_TEST_FILE_NAME, originalFileContentWithATitleProp);
    const expectedFileContent = 'import React from "react";\n'
      + 'import I18n from "../services/internationalizations/i18n";\n\n'
      + 'class TestClass extends React.Component {\n'
      + '  render() {\n'
      + '    return (\n'
      + '    <View>\n'
      + '   {someCondition && this.someCommand}\n'
      + '      <Text style={"center"} title={I18n.t("TestScreen.JSXAttribute.index(0)")}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n'
      + '      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n'
      + '      {120}\n'
      + '    </View>\n'
      + '    );\n'
      + '  }\n'
      + '}';
    fs.writeFileSync(jsonTestFileName, '{}');

    let jsFileContentWithReplacedKeys = parser
      .replaceStringsWithKeys(originalFileContentWithATitleProp,
        JS_TEST_FILE_NAME, jsonTestFileName);
    jsFileContentWithReplacedKeys = parser
      .writeImportStatementToJSContent(jsFileContentWithReplacedKeys);

    expect(jsFileContentWithReplacedKeys)
      .to
      .eql(expectedFileContent);
  });


  it('should not change file linting', () => {
    const originalFileContent = parser.readJsFileContent(path.resolve('src/tests/testCase.js'));
    const expectedFileContent = parser.readJsFileContent(path.resolve('src/tests/expectedTestCase.js'));
    fs.writeFileSync(jsonTestFileName, '{}');

    let returnedFileContent = parser.replaceStringsWithKeys(originalFileContent, JS_TEST_FILE_NAME, jsonTestFileName, 'src/tests/testCase.js');
    parserObject.jsContent = returnedFileContent;
    returnedFileContent = parserObject.writeImportStatementToJSContent();

    expect(returnedFileContent).to.eql(expectedFileContent);
  });

  it('should not change function parentheses location', () => {
    const originalFileContent = 'if (options.switchToTab) {\n'
      + '    this.setState({\n'
      + '        forceTab: options.switchToTab\n'
      + '    });\n'
      + '}';

    fs.writeFileSync('test.json', '{}');

    const returnedFileContent = parser.replaceStringsWithKeys(
      originalFileContent,
      'TestScreen.js',
      'test.json',
    );

    expect(returnedFileContent).to.eql(originalFileContent);
  });

  it('should leave multiline import statements without changing curly bracket location', () => {
    const originalFileContent = 'import {\n'
      + '    DEFAULT_ANIMATION_TYPE,\n'
      + '    SCREENS,\n'
      + '    DEVICE_EVENT_TYPES,\n'
      + '    MODAL_IDS,\n'
      + '    EVENT_IDS,\n'
      + '    VERSION_NUMBERS\n'
      + '} from "../../../constants";';
    fs.writeFileSync('test.json', '{}');

    const returnedFileContent = parser.replaceStringsWithKeys(
      originalFileContent,
      'TestScreen.js',
      'test.json',
    );

    expect(returnedFileContent).to.eql(originalFileContent);
  });

  it('should not change location of comments', () => {
    const originalFileContent = 'import {VERSION_NUMBERS} from "../../../constants";\n'
      + '\n'
      + ' // Actions\n'
      + 'import { updateBadgeInfo } from "../../../actions/badgeActions";\n'
      + '\n'
      + ' // Components\n'
      + 'import { TestComponent } from "../../../src/TestComponent";';
    fs.writeFileSync('test.json', '{}');

    const returnedFileContent = parser.replaceStringsWithKeys(
      originalFileContent,
      'TestScreen.js',
      'test.json',
    );

    expect(returnedFileContent).to.eql(originalFileContent);
  });

});
