/* globals describe it afterEach before after */
/* eslint no-template-curly-in-string: 0
          prefer-destructuring: 0
*/
const expect = require('chai').expect;
const fs = require('fs');
const parser = require('../parse');

describe('Extract And Replace Script', () => {
  describe('Extraction', () => {
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

    const originalFileContentWithExpressionText = 'import React from "react";\n'
        + 'class TestClass extends React.Component {\n'
        + '  render() {\n'
        + '    return (\n'
        + '    <View>\n'
        + '      <Text>{"Hello, world!"}</Text>\n'
        + '      <View><Text>{"Another Text"}</Text></View>\n'
        + '    </View>\n'
        + '    );\n'
        + '  }\n'
        + '}';

    const jsonTestFileName = 'test.json';
    const jsTestFileName = 'test.js';

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
      if (fs.existsSync('TestScreen.js')) {
        fs.unlinkSync('TestScreen.js');
      }
    });

    it('should read a js file', () => {
      const jsFileContent = 'Hello, world!';
      fs.writeFileSync(jsTestFileName, jsFileContent);

      const fileContent = parser.readJsFileContent(jsTestFileName);

      expect(fileContent).to.eql(jsFileContent);

      fs.unlinkSync(jsTestFileName);
    });

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
      fs.writeFileSync('TestScreen.js', originalJsFileContent);
      fs.writeFileSync(jsonTestFileName, '{}');


      parser.replaceStringsWithKeys(
        originalJsFileContent,
        'TestScreen.js',
        'test.json',
      );


      expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedJsFileContent);
    });

    it('should clean up the extracted string from all tabs and newlines', () => {
      const returnedString = parser.cleanUpExtractedString('\t\tTest\n\t\tString\n');
      expect(returnedString).to.eql('Test String');
    });

    it('should extract a string inside a Text component from a js file inside a render function', () => {
      const jsFileContent = 'import React from "react";'
          + 'class TestClass extends React.Component {'
          + '  render() {'
          + '    return ('
          + '          <Text>Hello, world!</Text>'
          + '    );'
          + '  }'
          + '}';
      const returnedStrings = parser.extractStrings(jsFileContent);

      expect(returnedStrings.length).to.eql(1);
      expect(returnedStrings[0]).to.eql({
        path: 'program.body.1.body.body.0.body.body.0.argument.children.0',
        type: 'JSXText',
        value: 'Hello, world!',
      });
    });

    it('should extract strings inside a js file inside a render function', () => {
      const returnedStrings = parser.extractStrings(originalFileContentWithJSXText);

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

      const keysAndPathsOfExtractedStrings = parser.writeToJsonFile(jsonTestFileName, 'TestScreen.js', testExtractedStrings);

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

    it('should replace the extracted JSXText strings with generated key', () => {
      const modifiedFileContent = 'import React from "react";\n'
          + 'import I18n from "../services/internationalizations/i18n";\n\n'
          + 'class TestClass extends React.Component {\n'
          + '  render() {\n'
          + '    return <View>\n'
          + '      <Text>{I18n.t("TestScreen.JSXText.index(0)")}</Text>\n'
          + '      <View><Text>{I18n.t("TestScreen.JSXText.index(1)")}</Text></View>\n'
          + '    </View>;\n'
          + '  }\n'
          + '\n'
          + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      const jsFileContentWithReplacedKeys = parser.replaceStringsWithKeys(originalFileContentWithJSXText, 'TestScreen.js', jsonTestFileName);

      expect(jsFileContentWithReplacedKeys).to.eql(modifiedFileContent);
    });

    it('should replace the extracted ExpressionText strings with generated key', () => {
      const modifiedFileContent = 'import React from "react";\n'
          + 'import I18n from "../services/internationalizations/i18n";\n\n'
          + 'class TestClass extends React.Component {\n'
          + '  render() {\n'
          + '    return <View>\n'
          + '      <Text>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n'
          + '      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n'
          + '    </View>;\n'
          + '  }\n'
          + '\n'
          + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      const jsFileContentWithReplacedKeys = parser.replaceStringsWithKeys(originalFileContentWithExpressionText, 'TestScreen.js', jsonTestFileName);

      expect(jsFileContentWithReplacedKeys).to.eql(modifiedFileContent);
    });

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
      fs.writeFileSync('TestScreen.js', '');

      expect(() => {
        parser.replaceStringsWithKeys(
          originalFileContentWithANonLiteralStringContainer,
          'TestScreen.js',
          jsonTestFileName,
        );
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
        parser.replaceStringsWithKeys(
          originalFileContentWithANonLiteralStringContainer,
          'TestScreen.js',
          jsonTestFileName,
        );
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
        parser.replaceStringsWithKeys(
          originalFileContentWithNoStringsToRetrieve,
          'TestScreen.js',
          jsonTestFileName,
        );
      }).to.not.throw();
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

      expect(extractedStrings).to.deep.contain({
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
        value: 'TEST_errorMessage',
      });
    });


    it('should replace texts inside title prop with an expression', () => {
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

      fs.writeFileSync('TestScreen.js', originalFileContentWithATitleProp);

      const expectedFileContent = 'import React from "react";\n'
          + 'import I18n from "../services/internationalizations/i18n";\n\n'
          + 'class TestClass extends React.Component {\n'
          + '  render() {\n'
          + '    return <View>\n'
          + '   {someCondition && this.someCommand}\n'
          + '      <Text style={"center"} title={I18n.t("TestScreen.JSXAttribute.index(0)")}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n'
          + '      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n'
          + '      {120}\n'
          + '    </View>;\n'
          + '  }\n\n'
          + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      parser.replaceStringsWithKeys(
        originalFileContentWithATitleProp,
        'TestScreen.js',
        jsonTestFileName,
      );

      expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContent);
    });

    it('should replace texts inside title prop without an expression', () => {
      const originalFileContentWithATitleProp = 'import React from "react";\n'
          + 'class TestClass extends React.Component {\n'
          + '  render() {\n'
          + '    return (\n'
          + '    <View>\n'
          + '   {someCondition && this.someCommand}\n'
          + '      <Text style={"center"} title="TEST_TITLE">{"Hello, world!"}</Text>\n'
          + '      <View><Text>{"Another Text"}</Text></View>\n'
          + '      {120}\n'
          + '    </View>\n'
          + '    );\n'
          + '  }\n'
          + '}';

      fs.writeFileSync('TestScreen.js', originalFileContentWithATitleProp);

      const expectedFileContent = 'import React from "react";\n'
          + 'import I18n from "../services/internationalizations/i18n";\n\n'
          + 'class TestClass extends React.Component {\n'
          + '  render() {\n'
          + '    return <View>\n'
          + '   {someCondition && this.someCommand}\n'
          + '      <Text style={"center"} title={I18n.t("TestScreen.JSXAttribute.index(0)")}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n'
          + '      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n'
          + '      {120}\n'
          + '    </View>;\n'
          + '  }\n\n'
          + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      parser.replaceStringsWithKeys(
        originalFileContentWithATitleProp,
        'TestScreen.js',
        jsonTestFileName,
      );

      expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContent);
    });

    it('should replace texts inside an interpolated string', () => {
      const originalFileContentWithATitleProp = 'import React from "react";\n'
          + 'class TestClass extends React.Component {\n'
          + '  render() {\n'
          + '    return (\n'
          + '    <View>\n'
          + '   {someCondition && this.someCommand}\n'
          + '      <Text style={"center"} title={`Hey ${Omar} We Love you`}>{"Hello, world!"}</Text>\n'
          + '      <View><Text>{"Another Text"}</Text></View>\n'
          + '      {120}\n'
          + '    </View>\n'
          + '    );\n'
          + '  }\n'
          + '}';

      fs.writeFileSync('TestScreen.js', originalFileContentWithATitleProp);

      const expectedFileContent = 'import React from "react";\n'
          + 'import I18n from "../services/internationalizations/i18n";\n\n'
          + 'class TestClass extends React.Component {\n'
          + '  render() {\n'
          + '    return <View>\n'
          + '   {someCondition && this.someCommand}\n'
          + '      <Text style={"center"} '
          + 'title={`${I18n.t("TestScreen.TemplateElement.index(0)")}${Omar}${I18n.t("TestScreen.TemplateElement.index(1)")}`}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n'
          + '      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n'
          + '      {120}\n'
          + '    </View>;\n'
          + '  }\n\n'
          + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      parser.replaceStringsWithKeys(
        originalFileContentWithATitleProp,
        'TestScreen.js',
        jsonTestFileName,
      );

      expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContent);
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
        parser.replaceStringsWithKeys(
          originalFileContentWithASelfClosingElement,
          'TestScreen.js',
          jsonTestFileName,
        );
      }).to.not.throw();
    });

    it('should replace texts inside conditional statement', () => {
      const originalFileContentWithATitleProp = 'import React from "react";\n'
          + 'class TestClass extends React.Component {\n'
          + '  someObject = someCondition ? [\'consequent text\'] : [\'alternate text\'];'
          + '  render() {\n'
          + '    return (\n'
          + '    <View></View>\n'
          + '    );\n'
          + '  }\n'
          + '}';

      fs.writeFileSync('TestScreen.js', originalFileContentWithATitleProp);

      const expectedFileContent = 'import React from "react";\n'
          + 'import I18n from "../services/internationalizations/i18n";\n\n'
          + 'class TestClass extends React.Component {\n'
          + '  someObject = someCondition ? [I18n.t("TestScreen.ConditionalExpression.index(0)")] : [I18n.t("TestScreen.ConditionalExpression.index(1)")];\n\n'
          + '  render() {\n'
          + '    return <View></View>;\n'
          + '  }\n\n'
          + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      parser.replaceStringsWithKeys(
        originalFileContentWithATitleProp,
        'TestScreen.js',
        jsonTestFileName,
      );

      expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContent);
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

      parser.replaceStringsWithKeys(
        originalFileContentWithARequireStatement,
        'TestScreen.js',
        jsonTestFileName,
      );

      expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(originalFileContentWithARequireStatement);
    });

    it('should replace title attribute inside object statement', () => {
      const originalFileContentWithAnAttributeInsideObject = 'import React from "react";\n\n'
          + 'class TestClass extends React.Component {\n'
          + '  render() {\n'
          + '   this.MODAL_CONTENT = {\n'
          + '       title: "Test title"\n'
          + '  }\n'
          + ' }\n'
          + '}';
      const expectedFileContentWithAnAttributeInsideObject = 'import React from "react";\n'
          + 'import I18n from "../services/internationalizations/i18n";\n\n'
          + 'class TestClass extends React.Component {\n'
          + '  render() {\n'
          + '    this.MODAL_CONTENT = {\n'
          + '      title: I18n.t("TestScreen.ObjectProperty.index(0)")\n'
          + '    };\n'
          + '  }\n\n'
          + '}';

      fs.writeFileSync('TestScreen.js', originalFileContentWithAnAttributeInsideObject);
      fs.writeFileSync(jsonTestFileName, '{}');

      parser.replaceStringsWithKeys(
        originalFileContentWithAnAttributeInsideObject,
        'TestScreen.js', jsonTestFileName,
      );

      expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContentWithAnAttributeInsideObject);
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

      parser.replaceStringsWithKeys(fileContentWithStyleValues, 'TestScreen.js', jsonTestFileName);

      expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(fileContentWithStyleValues);
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

      fs.writeFileSync('TestScreen.js', originalFileContentWithAStateAssignment);

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

      parser.replaceStringsWithKeys(
        originalFileContentWithAStateAssignment,
        'TestScreen.js',
        jsonTestFileName,
      );

      expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContent);
    });

    it('should ignore text in dimensions function call ', () => {
      const fileContentWithDimensionFunction = 'import React from "react";\n'
          + 'const width = Dimensions.get("window");\n\n'
          + 'class TestClass extends React.Component {\n'
          + '  render() {\n'
          + '    return <View></View>;\n'
          + '  }\n\n'
          + '}';

      fs.writeFileSync('output/TestScreen.js', fileContentWithDimensionFunction);
      fs.writeFileSync(jsonTestFileName, '{}');

      parser.replaceStringsWithKeys(
        fileContentWithDimensionFunction,
        'TestScreen.js',
        jsonTestFileName,
      );

      expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(fileContentWithDimensionFunction);
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


      parser.replaceStringsWithKeys(
        fileContentWithIgnoredCases,
        'TestScreen.js',
        jsonTestFileName,
      );

      expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(fileContentWithIgnoredCases);
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


      parser.replaceStringsWithKeys(
        fileContentWithIgnoredCases,
        'TestScreen.js',
        jsonTestFileName,
      );

      expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(fileContentWithIgnoredCases);
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
          + 'import I18n from "../services/internationalizations/i18n";\n\n'
          + 'const darkGrayCopyOptions = [{\n'
          + '  A: I18n.t("TestScreen.ObjectProperty.index(0)"),\n'
          + '  B: I18n.t("TestScreen.ObjectProperty.index(1)")\n'
          + '}];\n\n'
          + 'class TestClass extends React.Component {\n'
          + '  render() {\n'
          + '    return <View></View>;\n'
          + '  }\n\n'
          + '}';

      fs.writeFileSync('TestScreen.js', originalfileContentWithVariableDeclaration);
      fs.writeFileSync(jsonTestFileName, '{}');

      parser.replaceStringsWithKeys(
        originalfileContentWithVariableDeclaration,
        'TestScreen.js',
        jsonTestFileName,
      );

      expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedfileContentWithVariableDeclaration);
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
          + 'import I18n from "../services/internationalizations/i18n";\n\n'
          + 'const firstCalibrationPhrases = ['
          + 'I18n.t("TestScreen.ObjectProperty.index(0)"),'
          + ' I18n.t("TestScreen.ObjectProperty.index(1)")'
          + '];\n\n'
          + 'class TestClass extends React.Component {\n'
          + '  render() {\n'
          + '    return <View></View>;\n'
          + '  }\n\n'
          + '}';

      fs.writeFileSync('TestScreen.js', originalfileContentWithVariableDeclaration);
      fs.writeFileSync(jsonTestFileName, '{}');

      parser.replaceStringsWithKeys(
        originalfileContentWithVariableDeclaration,
        'TestScreen.js',
        jsonTestFileName,
      );

      expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedfileContentWithVariableDeclaration);
    });

    it('should put an evaluation curly bracket on an attributes value if it is inside a greater expression', () => {
      const originalFileContentWithATitleProp = 'import React from "react";\n'
          + 'class TestClass extends React.Component {\n'
          + '  render() {\n'
          + '    return (\n'
          + '    <View>\n'
          + '     {anotherCondition && <Text style={"center"} title="TEST_TITLE">{"Hello, world!"}</Text> }\n'
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
          + '     {anotherCondition && <Text style={"center"} title={I18n.t("TestScreen.JSXAttribute.index(0)")}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>}\n'
          + '      {120}\n'
          + '    </View>;\n'
          + '  }\n\n'
          + '}';
      fs.writeFileSync(jsonTestFileName, '{}');

      const actualFileContent = parser.replaceStringsWithKeys(
        originalFileContentWithATitleProp,
        'TestScreen.js',
        'test.json',
      );

      expect(actualFileContent).to.eql(expectedFileContent);
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

      const actualFileContent = parser.replaceStringsWithKeys(
        originalFileContentWithATitleProp,
        'TestScreen.js',
        'test.json',
      );

      expect(actualFileContent).to.eql(expectedFileContent);
    });


    // return `Today and tomorrow, this mission will appear on your calendar at this time:`;
    it('should retrieve literal text in return statement', () => {
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
      const extractedStrings = parser.replaceStringsWithKeys(
        originalJsWithReturnStatement,
        'TestScreen.js',
        'test.json',
      );

      expect(extractedStrings).to.eql(expectedFileContent);
    });

    it('should retrieve template literal text in return statement', () => {
      const originalJsWithReturnStatement = 'import React from "react";\n'
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
      const extractedStrings = parser.replaceStringsWithKeys(
        originalJsWithReturnStatement,
        'TestScreen.js',
        'test.json',
      );

      expect(extractedStrings).to.eql(expectedFileContent);
    });

    it('should retrieve text in return statement', () => {
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
      const extractedStrings = parser.replaceStringsWithKeys(
        originalJsWithReturnStatement,
        'TestScreen.js',
        'test.json',
      );

      expect(extractedStrings).to.eql(expectedFileContent);
    });

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
      const extractedStrings = parser.replaceStringsWithKeys(
        originalJsWithReturnStatement,
        'TestScreen.js',
        'test.json',
      );

      expect(extractedStrings).to.eql(expectedFileContent);
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

    it('should not insert an import statement if one already exists', () => {
      const originalFileContent = 'import React from "react";\n'
          + 'import I18n from "../services/internationalizations/i18n";\n\n'
          + 'class TestClass extends React.Component {\n'
          + '  render() {\n'
          + '    return <Text></Text>;\n'
          + '  }\n\n'
          + '}';

      fs.writeFileSync('test.json', '{}');
      const actualFileContent = parser.replaceStringsWithKeys(originalFileContent, 'TestScreen.js', 'test.json');
      expect(actualFileContent).to.eql(originalFileContent);
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

      fs.writeFileSync('test.json', '{}');
      const actualFileContent = parser.replaceStringsWithKeys(originalFileContent, 'TestScreen.js', 'test.json');
      expect(actualFileContent).to.eql(originalFileContent);
    });
  });
});
