/* globals describe it afterEach before after */
/* eslint no-template-curly-in-string: 0
          prefer-destructuring: 0
*/

const expect = require('chai').expect;
const fs = require('fs');
const { getOriginalFileContent , getModifiedFileContent, testParsedFileWithExpectedContent, JS_TEST_FILE_NAME, jsonTestFileName } = require('./common');
const parser = require('../parse');


const jsTestFileName = 'test.js';

describe('Replacement', () => {
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
    const originalRenderContent = '  render() {\n'
      + '    return (\n'
      + '    <View>\n'
      + '      <Text>Hello, world!</Text>\n'
      + '      <View><Text>Another Text</Text></View>\n'
      + '    </View>\n'
      + '    );\n'
      + '  }\n';
    const expectedRenderContent = '  render() {\n'
      + '    return <View>\n'
      + '      <Text>{I18n.t("TestScreen.JSXText.index(0)")}</Text>\n'
      + '      <View><Text>{I18n.t("TestScreen.JSXText.index(1)")}</Text></View>\n'
      + '    </View>;\n'
      + '  }\n'
      + '\n';

    testParsedFileWithExpectedContent(
      getOriginalFileContent(originalRenderContent),
      getModifiedFileContent(expectedRenderContent),
    );
  });

  it('should replace the extracted ExpressionText strings with generated key', () => {
    const originalRenderContent = '  render() {\n'
      + '    return (\n'
      + '    <View>\n'
      + '      <Text>{"Hello, world!"}</Text>\n'
      + '      <View><Text>{"Another Text"}</Text></View>\n'
      + '    </View>\n'
      + '    );\n'
      + '  }\n';
    const expectedRenderContent = '  render() {\n'
      + '    return <View>\n'
      + '      <Text>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n'
      + '      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n'
      + '    </View>;\n'
      + '  }\n'
      + '\n';


    testParsedFileWithExpectedContent(
      getOriginalFileContent(originalRenderContent),
      getModifiedFileContent(expectedRenderContent),
    );
  });

  it('should replace texts inside title prop with an expression', () => {
    const originalRenderContent = '  render() {\n'
      + '    return (\n'
      + '    <View>\n'
      + '   {someCondition && this.someCommand}\n'
      + '      <Text style={"center"} title={"TEST_TITLE"}>{"Hello, world!"}</Text>\n'
      + '      <View><Text>{"Another Text"}</Text></View>\n'
      + '      {120}\n'
      + '    </View>\n'
      + '    );\n'
      + '  }\n';
    const expectedRenderContent = '  render() {\n'
      + '    return <View>\n'
      + '   {someCondition && this.someCommand}\n'
      + '      <Text style={"center"} title={I18n.t("TestScreen.JSXAttribute.index(0)")}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n'
      + '      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n'
      + '      {120}\n'
      + '    </View>;\n'
      + '  }\n'
      + '\n';

    testParsedFileWithExpectedContent(
      getOriginalFileContent(originalRenderContent),
      getModifiedFileContent(expectedRenderContent),
    );
  });

  it('should replace texts inside title prop without an expression', () => {
    const originalRenderContent = '  render() {\n'
      + '    return (\n'
      + '    <View>\n'
      + '   {someCondition && this.someCommand}\n'
      + '      <Text style={"center"} title="TEST_TITLE">{"Hello, world!"}</Text>\n'
      + '      <View><Text>{"Another Text"}</Text></View>\n'
      + '      {120}\n'
      + '    </View>\n'
      + '    );\n'
      + '  }\n';
    const expectedRenderContent = '  render() {\n'
      + '    return <View>\n'
      + '   {someCondition && this.someCommand}\n'
      + '      <Text style={"center"} title={I18n.t("TestScreen.JSXAttribute.index(0)")}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n'
      + '      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n'
      + '      {120}\n'
      + '    </View>;\n'
      + '  }\n'
      + '\n';

    testParsedFileWithExpectedContent(
      getOriginalFileContent(originalRenderContent),
      getModifiedFileContent(expectedRenderContent),
    );
  });

  it('should replace texts inside an interpolated string', () => {
    const originalRenderContent = getOriginalFileContent('  render() {\n'
      + '    return (\n'
      + '    <View>\n'
      + '   {someCondition && this.someCommand}\n'
      + '      <Text style={"center"} title={`Hey ${Omar} We Love you`}>{"Hello, world!"}</Text>\n'
      + '      <View><Text>{"Another Text"}</Text></View>\n'
      + '      {120}\n'
      + '    </View>\n'
      + '    );\n'
      + '  }\n');
    const expectedRenderContent = getModifiedFileContent('  render() {\n'
      + '    return <View>\n'
      + '   {someCondition && this.someCommand}\n'
      + '      <Text style={"center"} '
      + 'title={`${I18n.t("TestScreen.TemplateElement.index(0)")}${Omar}${I18n.t("TestScreen.TemplateElement.index(1)")}`}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n'
      + '      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n'
      + '      {120}\n'
      + '    </View>;\n'
      + '  }\n'
      + '\n');

    testParsedFileWithExpectedContent(originalRenderContent, expectedRenderContent);
  });

  it('should replace texts inside conditional statement', () => {
    const originalClassAttributeText = '  someObject = someCondition ? [\'consequent text\'] : [\'alternate text\'];';
    const expectedClassAttributeText = '  someObject = someCondition ? [I18n.t("TestScreen.ConditionalExpression.index(0)")] : [I18n.t("TestScreen.ConditionalExpression.index(1)")];\n\n';

    const originalFileContentWithATitleProp = getOriginalFileContent(`${originalClassAttributeText}  render() {\n`
      + '    return (\n'
      + '    <View></View>\n'
      + '    );\n'
      + '  }\n');
    const expectedFileContent = getModifiedFileContent(`${expectedClassAttributeText}  render() {\n`
      + '    return <View></View>;\n'
      + '  }\n'
      + '\n');

    testParsedFileWithExpectedContent(originalFileContentWithATitleProp, expectedFileContent);
  });

  it('should replace title attribute inside object statement', () => {
    const originalWithAnAttributeInsideObject = getOriginalFileContent('  render() {\n'
      + '   this.MODAL_CONTENT = {\n'
      + '       title: "Test title"\n'
      + '  }\n'
      + '  }\n');

    const expectedContentWithAnAttributeInsideObject = getModifiedFileContent('  render() {\n'
      + '    this.MODAL_CONTENT = {\n'
      + '      title: I18n.t("TestScreen.ObjectProperty.index(0)")\n'
      + '    };\n'
      + '  }\n'
      + '\n');

    testParsedFileWithExpectedContent(
      originalWithAnAttributeInsideObject,
      expectedContentWithAnAttributeInsideObject,
    );
  });

  it('should replace texts inside state assignment statement', () => {
    const originalFileContentWithAStateAssignment = 'import React from "react";\n'
      + 'class TestClass extends React.Component {\n\n\n\n'
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

    testParsedFileWithExpectedContent(
      originalFileContentWithAStateAssignment,
      expectedFileContent,
    );
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
    testParsedFileWithExpectedContent(
      originalfileContentWithVariableDeclaration,
      expectedfileContentWithVariableDeclaration,
    );
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
    testParsedFileWithExpectedContent(
      originalfileContentWithVariableDeclaration,
      expectedfileContentWithVariableDeclaration,
    );
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
    testParsedFileWithExpectedContent(originalFileContentWithTextProp, expectedFileContent);
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

    testParsedFileWithExpectedContent(originalFileContentWithATitleProp, expectedFileContent);
  });

  it('should replace literal text in return statement', () => {
    const originalJsWithReturnStatement = 'import React from "react";\n'
      + 'class TestClass extends React.Component {\n'
      + '  getHelloText() {\n'
      + '   return `Today and tomorrow, this mission will appear on your calendar at this time:`;\n'
      + ' }\n'
      + '}';
    const expectedFileContent = 'import React from "react";\n'
      + 'import I18n from "../services/internationalizations/i18n";\n\n'
      + 'class TestClass extends React.Component {\n'
      + '  getHelloText() {\n'
      + '    return `${I18n.t("TestScreen.TemplateElement.index(0)")}`;\n'
      + '  }\n\n'
      + '}';
    testParsedFileWithExpectedContent(originalJsWithReturnStatement, expectedFileContent);
  });

  it('should replace template literal text in return statement', () => {
    const originalJsWithLiteralInReturnStatement = 'import React from "react";\n'
      + 'class TestClass extends React.Component {\n'
      + '  render() {\n'
      + '   return `Today and tomorrow, ${this.test}  this mission will appear on your calendar at this time:`;\n'
      + ' }\n'
      + '}';
    const expectedFileContent = 'import React from "react";\n'
      + 'import I18n from "../services/internationalizations/i18n";\n\n'
      + 'class TestClass extends React.Component {\n'
      + '  render() {\n'
      + '    return `${I18n.t("TestScreen.TemplateElement.index(0)")}${this.test}${I18n.t("TestScreen.TemplateElement.index(1)")}`;\n'
      + '  }\n\n'
      + '}';

    testParsedFileWithExpectedContent(
      originalJsWithLiteralInReturnStatement,
      expectedFileContent,
    );
  });

  it('should replace text inside method statement', () => {
    const originalJsWithReturnStatement = 'import React from "react";\n'
      + 'class TestClass extends React.Component {\n'
      + '  calculate() {\n'
      + '   return "Today and tomorrow, this mission will appear on your calendar at this time:";\n'
      + ' }\n'
      + '}';
    const expectedFileContent = 'import React from "react";\n'
      + 'import I18n from "../services/internationalizations/i18n";\n\n'
      + 'class TestClass extends React.Component {\n'
      + '  calculate() {\n'
      + '    return I18n.t("TestScreen.ReturnExpression.index(0)");\n'
      + '  }\n\n'
      + '}';

    testParsedFileWithExpectedContent(originalJsWithReturnStatement, expectedFileContent);
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
    const expectedFileContent = 'import React from "react";\n'
      + 'import I18n from "../services/internationalizations/i18n";\n'
      + 'class TestClass extends React.Component {\n'
      + '  calculateKeyboardType() {\n'
      + '    if (keyRepresentation === "idealWeight")\n'
      + '      return "Today and tomorrow, this mission will appear on your calendar at this time:";\n'
      + ' }\n'
      + '}';

    testParsedFileWithExpectedContent(originalJsWithReturnStatement, expectedFileContent);
  });
});
