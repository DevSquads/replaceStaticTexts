const expect = require("chai").expect;
const parser = require("./parse");
const fs = require('fs');

describe('Extract And Replace Script', () => {
    describe('Extraction', () => {
        let originalFileContentWithJSXText = `import React from "react";\n` +
            `class TestClass extends React.Component {\n` +
            `  render() {\n` +
            `    return (\n` +
            `    <View>\n` +
            `      <Text>Hello, world!</Text>\n` +
            `      <View><Text>Another Text</Text></View>\n` +
            `    </View>\n` +
            `    );\n` +
            `  }\n` +
            `}`;

        let originalFileContentWithExpressionText = `import React from "react";\n` +
            `class TestClass extends React.Component {\n` +
            `  render() {\n` +
            `    return (\n` +
            `    <View>\n` +
            `      <Text>{"Hello, world!"}</Text>\n` +
            `      <View><Text>{"Another Text"}</Text></View>\n` +
            `    </View>\n` +
            `    );\n` +
            `  }\n` +
            `}`;

        let jsonTestFileName = 'test.json';
        let jsTestFileName = 'test.js';

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
            let files = fs.readdirSync('output');
            for (let i = 0; i < files.length; i++) {
                fs.unlinkSync('output/' + files[i]);
            }
            fs.rmdirSync('output');
            if (fs.existsSync('TestScreen.js')) {
                fs.unlinkSync('TestScreen.js');
            }
        });

        it('should read a js file', () => {
            let jsFileContent = 'Hello, world!';
            fs.writeFileSync(jsTestFileName, jsFileContent);

            let fileContent = parser.readJsFileContent(jsTestFileName);

            expect(fileContent).to.eql(jsFileContent);

            fs.unlinkSync(jsTestFileName);
        });

        it('should write import statement to the beginning of js file', () => {
            let originalJsFileContent = `import React from "react";\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `          <Text>Hello, world!</Text>\n` +
                `    );\n` +
                `  }\n` +
                `}`;

            let expectedJsFileContent = `import React from "react";\n` +
                'import I18n from "../services/internationalizations/i18n";\n\n' +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return <Text>{I18n.t("TestScreen.JSXText.index(0)")}</Text>;\n` +
                `  }\n\n` +
                `}`;
            fs.writeFileSync('TestScreen.js', originalJsFileContent);
            fs.writeFileSync(jsonTestFileName, '{}');


            parser.replaceStringsWithKeys(
                originalJsFileContent,
                'TestScreen.js',
                'test.json'
            );


            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedJsFileContent);
        });

        it('should clean up the extracted string from all tabs and newlines', () => {
            let returnedString = parser.cleanUpExtractedString("\t\tTest\n\t\tString\n");
            expect(returnedString).to.eql("Test String");
        });

        it('should extract a string inside a Text component from a js file inside a render function', () => {
            let jsFileContent = `import React from "react";` +
                `class TestClass extends React.Component {` +
                `  render() {` +
                `    return (` +
                `          <Text>Hello, world!</Text>` +
                `    );` +
                `  }` +
                `}`;
            let returnedStrings = parser.extractStrings(jsFileContent);

            expect(returnedStrings.length).to.eql(1);
            expect(returnedStrings[0]).to.eql({
                path: 'program.body.1.body.body.0.body.body.0.argument.children.0',
                type: 'JSXText',
                value: 'Hello, world!'
            });
        });

        it('should extract strings inside a js file inside a render function', () => {
            let returnedStrings = parser.extractStrings(originalFileContentWithJSXText);

            expect(returnedStrings.length).to.eql(2);
            expect(returnedStrings[0]).to.eql({
                path: 'program.body.1.body.body.0.body.body.0.argument.children.1.children.0',
                type: 'JSXText',
                value: 'Hello, world!'
            });
            expect(returnedStrings[1]).to.eql({
                path: 'program.body.1.body.body.0.body.body.0.argument.children.3.children.0.children.0',
                type: 'JSXText',
                value: 'Another Text'
            });
        });

        it('should write to json file with correct key', () => {
            fs.writeFileSync(jsonTestFileName, '{}');
            let testExtractedStrings = [{
                type: 'JSXText',
                value: 'Hello, world!'
            }];

            parser.writeToJsonFile(jsonTestFileName, 'TestScreen', testExtractedStrings);

            expect(fs.existsSync(jsonTestFileName));
            let jsonFileContent = fs.readFileSync(jsonTestFileName, 'utf8');
            expect(jsonFileContent).to.eql('{\n    "TestScreen.JSXText.index(0)": "Hello, world!"\n}');
        });

        it('should write to json file with correct key case 2', () => {
            fs.writeFileSync(jsonTestFileName, '{\n"AnotherTestScreen.JSXText.index(0)": "Just another text"\n}');
            let testExtractedStrings = [{
                path: 'just.a.test.path',
                type: 'JSXText',
                value: 'Hello, world!'
            }];

            let keysAndPathsOfExtractedStrings = parser.writeToJsonFile(jsonTestFileName, 'TestScreen.js', testExtractedStrings);

            expect(keysAndPathsOfExtractedStrings[0]).to.eql({
                path: 'just.a.test.path',
                key: 'TestScreen.JSXText.index(0)',
                value: 'Hello, world!'
            });
            expect(fs.existsSync(jsonTestFileName)).to.be.true;
            let jsonFileContent = fs.readFileSync(jsonTestFileName, 'utf8');
            expect(jsonFileContent).to.eql('{\n    "AnotherTestScreen.JSXText.index(0)": "Just another text",\n   ' +
                ' "TestScreen.JSXText.index(0)": "Hello, world!"\n}');
        });

        it('should replace the extracted JSXText strings with generated key', () => {
            let modifiedFileContent = `import React from "react";\n` +
                'import I18n from "../services/internationalizations/i18n";\n\n' +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return <View>\n` +
                `      <Text>{I18n.t("TestScreen.JSXText.index(0)")}</Text>\n` +
                `      <View><Text>{I18n.t("TestScreen.JSXText.index(1)")}</Text></View>\n` +
                `    </View>;\n` +
                `  }\n` +
                `\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            let jsFileContentWithReplacedKeys = parser.replaceStringsWithKeys(originalFileContentWithJSXText, 'TestScreen.js', jsonTestFileName);

            expect(jsFileContentWithReplacedKeys).to.eql(modifiedFileContent);
        });

        it('should replace the extracted ExpressionText strings with generated key', () => {
            let modifiedFileContent = `import React from "react";\n` +
                'import I18n from "../services/internationalizations/i18n";\n\n' +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return <View>\n` +
                `      <Text>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n` +
                `      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n` +
                `    </View>;\n` +
                `  }\n` +
                `\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            let jsFileContentWithReplacedKeys = parser.replaceStringsWithKeys(originalFileContentWithExpressionText, 'TestScreen.js', jsonTestFileName);

            expect(jsFileContentWithReplacedKeys).to.eql(modifiedFileContent);
        });

        it('should not throw an exception when a non literal string expression container is met', () => {
            let originalFileContentWithANonLiteralStringContainer = `import React from "react";\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View>\n` +
                `   {someCondition && console.log('test')}` +
                `      <Text>{"Hello, world!"}</Text>\n` +
                `      <View><Text>{"Another Text"}</Text></View>\n` +
                `    </View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');
            fs.writeFileSync('TestScreen.js', '');

            expect(() => {
                parser.replaceStringsWithKeys(
                    originalFileContentWithANonLiteralStringContainer,
                    'TestScreen.js',
                    jsonTestFileName
                )
            }).to.not.throw();
        });

        it('should not throw an exception when an expression with a non string value is met', () => {
            let stringType = 'JSXExpressionContainer';
            let originalFileContentWithANonLiteralStringContainer = `import React from "react";\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View>\n` +
                `   {someCondition && console.log('test')}` +
                `      <Text>{"Hello, world!"}</Text>\n` +
                `      <View><Text>{"Another Text"}</Text></View>\n` +
                `      {120}\n` +
                `    </View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            expect(() => {
                parser.replaceStringsWithKeys(
                    originalFileContentWithANonLiteralStringContainer,
                    'TestScreen.js',
                    jsonTestFileName
                )
            }).to.not.throw();
        });

        it('should not throw an exception when there is no strings to extract', () => {
            let originalFileContentWithNoStringsToRetrieve = `import React from "react";\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View>\n` +
                `    </View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            expect(() => {
                parser.replaceStringsWithKeys(
                    originalFileContentWithNoStringsToRetrieve,
                    'TestScreen.js',
                    jsonTestFileName
                )
            }).to.not.throw();
        });

        it('should not retrieve text inside a style expression', () => {
            let originalFileContentWithAStyleExpression = `import React from "react";\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View>\n` +
                `   {someCondition && console.log('test')}` +
                `      <Text style={"center"}>{"Hello, world!"}</Text>\n` +
                `      <View><Text>{"Another Text"}</Text></View>\n` +
                `      {120}\n` +
                `    </View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            let extractedStrings = parser.extractStrings(originalFileContentWithAStyleExpression);

            expect(extractedStrings).to.not.deep.contain({
                "path": "program.body.1.body.body.0.body.body.0.argument.children.3.openingElement.attributes.0.expression.value",
                "type": "JSXExpressionContainer",
                "value": "center"
            });
        });

        it('should retrieve texts inside title prop', () => {
            let originalFileContentWithATitleProp = `import React from "react";\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View>\n` +
                `   {someCondition && console.log('test')}` +
                `      <Text style={"center"} title={"TEST_TITLE"}>{"Hello, world!"}</Text>\n` +
                `      <View><Text>{"Another Text"}</Text></View>\n` +
                `      {120}\n` +
                `    </View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            let extractedStrings = parser.extractStrings(originalFileContentWithATitleProp);

            expect(extractedStrings).to.deep.contain({
                "path": "program.body.1.body.body.0.body.body.0.argument.children.3.openingElement.attributes.1.expression",
                "type": "JSXAttribute",
                "value": "TEST_TITLE"
            });
        });

        it('should retrieve texts inside errMessage prop', () => {
            let originalFileContentWithAerrMessageProp = `import React from "react";\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View>\n` +
                `   {someCondition && console.log('test')}` +
                `      <Text style={"center"} errMessage={"TEST_errMessage"}>{"Hello, world!"}</Text>\n` +
                `      <View><Text>{"Another Text"}</Text></View>\n` +
                `      {120}\n` +
                `    </View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            let extractedStrings = parser.extractStrings(originalFileContentWithAerrMessageProp);

            expect(extractedStrings).to.deep.contain({
                "path": "program.body.1.body.body.0.body.body.0.argument.children.3.openingElement.attributes.1.expression",
                "type": "JSXAttribute",
                "value": "TEST_errMessage"
            });
        });

        it('should retrieve texts inside content prop', () => {
            let originalFileContentWithAContentProp = `import React from "react";\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View>\n` +
                `   {someCondition && console.log('test')}` +
                `      <Text style={"center"} content={"TEST_TITLE"}>{"Hello, world!"}</Text>\n` +
                `      <View><Text>{"Another Text"}</Text></View>\n` +
                `      {120}\n` +
                `    </View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            let extractedStrings = parser.extractStrings(originalFileContentWithAContentProp);

            expect(extractedStrings).to.deep.contain({
                "path": "program.body.1.body.body.0.body.body.0.argument.children.3.openingElement.attributes.1.expression",
                "type": "JSXAttribute",
                "value": "TEST_TITLE"
            });
        });

        it('should retrieve texts inside placeholder/tip/erromessage prop', () => {
            let originalFileContentWithAPlaceholderProp = `import React from "react";\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View>\n` +
                `   {someCondition && console.log('test')}` +
                `      <Text style={"center"} placeholder={"TEST_PLACEHOLDER"}>{"Hello, world!"}</Text>\n` +
                `      <Text style={"center"} tip={"TEST_tip"}>{"Hello, world!"}</Text>\n` +
                `      <Text style={"center"} errormessage={"TEST_errormessage"}>{"Hello, world!"}</Text>\n` +

                `      <View><Text>{"Another Text"}</Text></View>\n` +
                `      {120}\n` +
                `    </View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            let extractedStrings = parser.extractStrings(originalFileContentWithAPlaceholderProp);

            expect(extractedStrings).to.deep.contain({
                    "path": "program.body.1.body.body.0.body.body.0.argument.children.3.openingElement.attributes.1.expression",
                    "type": "JSXAttribute",
                    "value": "TEST_PLACEHOLDER"
                },
                {
                    "path": "program.body.1.body.body.0.body.body.0.argument.children.3.openingElement.attributes.1.expression",
                    "type": "JSXAttribute",
                    "value": "TEST_tip"
                }, {
                    "path": "program.body.1.body.body.0.body.body.0.argument.children.3.openingElement.attributes.1.expression",
                    "type": "JSXAttribute",
                    "value": "TEST_errormessage"
                });
        });


        it('should replace texts inside title prop with an expression', () => {
            let originalFileContentWithATitleProp = `import React from "react";\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View>\n` +
                `   {someCondition && this.someCommand}\n` +
                `      <Text style={"center"} title={"TEST_TITLE"}>{"Hello, world!"}</Text>\n` +
                `      <View><Text>{"Another Text"}</Text></View>\n` +
                `      {120}\n` +
                `    </View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;

            fs.writeFileSync('TestScreen.js', originalFileContentWithATitleProp);

            let expectedFileContent = `import React from "react";\n` +
                'import I18n from "../services/internationalizations/i18n";\n\n' +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return <View>\n` +
                `   {someCondition && this.someCommand}\n` +
                `      <Text style={"center"} title={I18n.t("TestScreen.JSXAttribute.index(0)")}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n` +
                `      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n` +
                `      {120}\n` +
                `    </View>;\n` +
                `  }\n\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            parser.replaceStringsWithKeys(
                originalFileContentWithATitleProp,
                'TestScreen.js',
                jsonTestFileName
            );

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContent);
        });

        it('should replace texts inside title prop without an expression', () => {
            let originalFileContentWithATitleProp = `import React from "react";\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View>\n` +
                `   {someCondition && this.someCommand}\n` +
                `      <Text style={"center"} title="TEST_TITLE">{"Hello, world!"}</Text>\n` +
                `      <View><Text>{"Another Text"}</Text></View>\n` +
                `      {120}\n` +
                `    </View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;

            fs.writeFileSync('TestScreen.js', originalFileContentWithATitleProp);

            let expectedFileContent = `import React from "react";\n` +
                'import I18n from "../services/internationalizations/i18n";\n\n' +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return <View>\n` +
                `   {someCondition && this.someCommand}\n` +
                `      <Text style={"center"} title={I18n.t("TestScreen.JSXAttribute.index(0)")}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>\n` +
                `      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n` +
                `      {120}\n` +
                `    </View>;\n` +
                `  }\n\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            parser.replaceStringsWithKeys(
                originalFileContentWithATitleProp,
                'TestScreen.js',
                jsonTestFileName
            );

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContent);
        });

        it('should replace texts inside an interpolated string', () => {
            let originalFileContentWithATitleProp = `import React from "react";\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View>\n` +
                `   {someCondition && this.someCommand}\n` +
                "      <Text style={\"center\"} title={`Hey ${Omar} We Love you`}>{\"Hello, world!\"}</Text>\n" +
                `      <View><Text>{"Another Text"}</Text></View>\n` +
                `      {120}\n` +
                `    </View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;

            fs.writeFileSync('TestScreen.js', originalFileContentWithATitleProp);

            let expectedFileContent = `import React from "react";\n` +
                'import I18n from "../services/internationalizations/i18n";\n\n' +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return <View>\n` +
                `   {someCondition && this.someCommand}\n` +
                `      <Text style={"center"} ` +
                "title={`${I18n.t(\"TestScreen.TemplateElement.index(0)\")}${Omar}${I18n.t(\"TestScreen.TemplateElement.index(1)\")}`}>{I18n.t(\"TestScreen.JSXExpressionContainer.index(0)\")}</Text>\n" +
                `      <View><Text>{I18n.t("TestScreen.JSXExpressionContainer.index(1)")}</Text></View>\n` +
                `      {120}\n` +
                `    </View>;\n` +
                `  }\n\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            parser.replaceStringsWithKeys(
                originalFileContentWithATitleProp,
                'TestScreen.js',
                jsonTestFileName
            );

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContent);
        });

        it('should not throw an exception when faced with an empty expression', () => {
            let originalFileContentWithASelfClosingElement = `import React from "react";\n` +
                'import I18n from "../services/internationalizations/i18n";\n\n' +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View>\n` +
                `       {" "}\n` +
                `    </View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            expect(() => {
                parser.replaceStringsWithKeys(
                    originalFileContentWithASelfClosingElement,
                    'TestScreen.js',
                    jsonTestFileName
                )
            }).to.not.throw();
        });

        it('should replace texts inside conditional statement', () => {
            let originalFileContentWithATitleProp = `import React from "react";\n` +
                `class TestClass extends React.Component {\n` +
                `  someObject = someCondition ? ['consequent text'] : ['alternate text'];` +
                `  render() {\n` +
                `    return (\n` +
                `    <View></View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;

            fs.writeFileSync('TestScreen.js', originalFileContentWithATitleProp);

            let expectedFileContent = `import React from "react";\n` +
                'import I18n from "../services/internationalizations/i18n";\n\n' +
                `class TestClass extends React.Component {\n` +
                `  someObject = someCondition ? [I18n.t("TestScreen.ConditionalExpression.index(0)")] : [I18n.t("TestScreen.ConditionalExpression.index(1)")];\n\n` +
                `  render() {\n` +
                `    return <View></View>;\n` +
                `  }\n\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            parser.replaceStringsWithKeys(
                originalFileContentWithATitleProp,
                'TestScreen.js',
                jsonTestFileName
            );

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContent);
        });

        it('should not replace texts inside require statement', () => {
            let originalFileContentWithARequireStatement = `import React from "react";\n\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return <Image source={fillLeftFoot ? require("../../../assets/feet/left-foot-solid-full.png") : require("../../../assets/feet/left-foot-solid-empty.png")} />;\n` +
                `  }\n\n` +
                `}`;

            fs.writeFileSync('TestScreen.js', originalFileContentWithARequireStatement);
            fs.writeFileSync(jsonTestFileName, '{}');

            parser.replaceStringsWithKeys(
                originalFileContentWithARequireStatement,
                'TestScreen.js',
                jsonTestFileName
            );

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(originalFileContentWithARequireStatement);
        });

        it('should replace title attribute inside object statement', () => {
            let originalFileContentWithAnAttributeInsideObject = 'import React from "react";\n\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {\n' +
                '   this.MODAL_CONTENT = {\n' +
                '       title: "Friendly Shapa reminder"\n' +
                '  }\n' +
                ' }\n' +
                '}';
            let expectedFileContentWithAnAttributeInsideObject = 'import React from "react";\n' +
                'import I18n from "../services/internationalizations/i18n";\n\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {\n' +
                '    this.MODAL_CONTENT = {\n' +
                '      title: I18n.t("TestScreen.ObjectProperty.index(0)")\n' +
                '    };\n' +
                '  }\n\n' +
                '}';

            fs.writeFileSync('TestScreen.js', originalFileContentWithAnAttributeInsideObject);
            fs.writeFileSync(jsonTestFileName, '{}');

            parser.replaceStringsWithKeys(
                originalFileContentWithAnAttributeInsideObject,
                'TestScreen.js', jsonTestFileName);

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContentWithAnAttributeInsideObject);
        });

        it('should not replace style values', () => {
            let fileContentWithStyleValues = 'import React from "react";\n' +
                'const styles = StyleSheet.create({\n' +
                '  button: {\n' +
                '    justifyContent: "center"\n' +
                '  }\n' +
                '});\n\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {}\n\n' +
                '}';

            fs.writeFileSync('TestScreen.js', fileContentWithStyleValues);
            fs.writeFileSync(jsonTestFileName, '{}');

            parser.replaceStringsWithKeys(fileContentWithStyleValues, 'TestScreen.js', jsonTestFileName);

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(fileContentWithStyleValues);
        });

        it('should replace texts inside state assignment statement', () => {
            let originalFileContentWithAStateAssignment = `import React from "react";\n` +
                `class TestClass extends React.Component {\n\n` +
                `  constructor() {\n` +
                `    this.state = {\n` +
                `      errors: {\n` +
                `        password: 'Some cool test string'\n` +
                `      }\n` +
                `    }\n` +
                `  }\n\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View></View>\n` +
                `    );\n` +
                `  }\n\n` +
                `}`;

            fs.writeFileSync('TestScreen.js', originalFileContentWithAStateAssignment);

            let expectedFileContent = `import React from "react";\n` +
                'import I18n from "../services/internationalizations/i18n";\n\n' +
                `class TestClass extends React.Component {\n` +
                `  constructor() {\n` +
                `    this.state = {\n` +
                `      errors: {\n` +
                `        password: I18n.t("TestScreen.ObjectProperty.index(0)")\n` +
                `      }\n` +
                `    };\n` +
                `  }\n\n` +
                `  render() {\n` +
                `    return <View></View>;\n` +
                `  }\n\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            parser.replaceStringsWithKeys(
                originalFileContentWithAStateAssignment,
                'TestScreen.js',
                jsonTestFileName
            );

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContent);
        });

        it('should ignore text in dimensions function call ', () => {
            let fileContentWithDimensionFunction = 'import React from "react";\n' +
                'const width = Dimensions.get("window");\n\n' +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return <View></View>;\n` +
                `  }\n\n` +
                `}`;

            fs.writeFileSync('TestScreen.js', fileContentWithDimensionFunction);
            fs.writeFileSync(jsonTestFileName, '{}');

            parser.replaceStringsWithKeys(
                fileContentWithDimensionFunction,
                'TestScreen.js',
                jsonTestFileName
            );

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(fileContentWithDimensionFunction);
        });

        it('should ignore text in emoji function call ', () => {
            fs.writeFileSync('TestScreen.js');

            fs.writeFileSync(jsonTestFileName, '{}');
            let fileContentWithIgnoredCases = 'import React from "react";\n' +
                'const ignoredCase1 = StyleSheet.get("smiley");\n' +
                'const ignoredCase2 = Dimensions.get("smiley");\n' +
                'const ignoredCase3 = emoji.get("smiley");\n' +
                'const ignoredCase4 = object.setDrawerEnabled("smiley");\n' +
                'const ignoredCase5 = OS.get("smiley");\n' +
                'const ignoredCase6 = moment.get("smiley");\n' +
                'const ignoredCase7 = utcMoment.get("smiley");\n' +
                'const ignoredCase8 = OS.handleChangedInput("string");\n' +
                'const ignoredCase9 = OS.addEventListener("string");\n' +
                'const ignoredCase10 = OS.removeEventListener("string");\n' +
                'const ignoredCase11 = OS.PropTypes("string");\n\n' +
                'const aComponent = () => {\n' +
                '  <View style={{\n' +
                '    color: "white"\n' +
                '  }}></View>;\n' +
                '};\n\n' +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                '    return <View>{config.someCondition === "text" && <Text></Text>}</View>;\n' +
                `  }\n\n` +
                `}`;

            parser.replaceStringsWithKeys(
                fileContentWithIgnoredCases,
                'TestScreen.js',
                jsonTestFileName
            );

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(fileContentWithIgnoredCases);
        });

        it('should ignore text in flexDirection style call ', () => {
            fs.writeFileSync('TestScreen.js');

            fs.writeFileSync(jsonTestFileName, '{}');
            let fileContentWithIgnoredCases = 'import React from "react";\n' +
                '<View style={{\n' +
                '  color: "white"\n' +
                '}}></View>;\n\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {\n' +
                '    const flexDirection = mission.status === "RECOMMENDED" || mission.status === "SKIPPED" ? "text1" : "text2";\n' +
                '  }\n\n' +
                '}';

            parser.replaceStringsWithKeys(
                fileContentWithIgnoredCases,
                'TestScreen.js',
                jsonTestFileName
            );

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(fileContentWithIgnoredCases);
        });
        it('should replace text in object declaration in side variable declaration ', () => {
            let originalfileContentWithVariableDeclaration = 'import React from "react";\n' +
                'const darkGrayCopyOptions = [{\n' +
                '  A: "Small steps can get a revolution started!",\n' +
                '  B: "Starting with your mission today:"\n' +
                '}];\n\n' +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return <View></View>;\n` +
                `  }\n\n` +
                `}`;
            let expectedfileContentWithVariableDeclaration = 'import React from "react";\n' +
                'import I18n from "../services/internationalizations/i18n";\n' +
                'const darkGrayCopyOptions = [{\n' +
                '  A: I18n.t("TestScreen.ObjectProperty.index(0)"),\n' +
                '  B: I18n.t("TestScreen.ObjectProperty.index(1)")\n' +
                '}];\n\n' +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return <View></View>;\n` +
                `  }\n\n` +
                `}`;

            fs.writeFileSync('TestScreen.js', originalfileContentWithVariableDeclaration);
            fs.writeFileSync(jsonTestFileName, '{}');

            parser.replaceStringsWithKeys(
                originalfileContentWithVariableDeclaration,
                'TestScreen.js',
                jsonTestFileName
            );

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedfileContentWithVariableDeclaration);
        });

        it('should put an evaluation curly bracket on an attributes value if it is inside a greater expression', () => {
            let originalFileContentWithATitleProp = `import React from "react";\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View>\n` +
                `     {anotherCondition && <Text style={"center"} title="TEST_TITLE">{"Hello, world!"}</Text> }\n` +
                `      {120}\n` +
                `    </View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;

            let expectedFileContent = `import React from "react";\n` +
                `import I18n from "../services/internationalizations/i18n";\n\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return <View>\n` +
                `     {anotherCondition && <Text style={"center"} title={I18n.t("TestScreen.JSXAttribute.index(0)")}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>}\n` +
                `      {120}\n` +
                `    </View>;\n` +
                `  }\n\n` +
                `}`
            fs.writeFileSync(jsonTestFileName, '{}');

            let actualFileContent = parser.replaceStringsWithKeys(
                originalFileContentWithATitleProp,
                'TestScreen.js',
                'test.json'
            );

            expect(actualFileContent).to.eql(expectedFileContent);
        });

        it('should not evaluate inside an evaluation expression', () => {
            let originalFileContentWithATitleProp = `import React from "react";\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View>\n` +
                `     {anotherCondition && <Text style={"center"} title={someCondition ? "TEST_TITLE" : "ANOTHER_TITLE"}>{"Hello, world!"}</Text> }\n` +
                `      {120}\n` +
                `    </View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;

            let expectedFileContent = `import React from "react";\n` +
                `import I18n from "../services/internationalizations/i18n";\n\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return <View>\n` +
                `     {anotherCondition && <Text style={"center"} title={someCondition ? I18n.t("TestScreen.JSXAttribute.index(0)") : I18n.t("TestScreen.JSXAttribute.index(1)")}>{I18n.t("TestScreen.JSXExpressionContainer.index(0)")}</Text>}\n` +
                `      {120}\n` +
                `    </View>;\n` +
                `  }\n\n` +
                `}`
            fs.writeFileSync(jsonTestFileName, '{}');

            let actualFileContent = parser.replaceStringsWithKeys(
                originalFileContentWithATitleProp,
                'TestScreen.js',
                'test.json'
            );

            expect(actualFileContent).to.eql(expectedFileContent);
        });


        //return `Today and tomorrow, this mission will appear on your calendar at this time:`;
        it('should retrieve literal text in return statement', () => {
            let originalJsWithReturnStatement = 'import React from "react";\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {\n' +
                '   return `Today and tomorrow, this mission will appear on your calendar at this time:`;\n' +
                ' }\n' +
                '}';
            fs.writeFileSync(jsonTestFileName, '{}');
            let expectedFileContent = 'import React from "react";\n' +
                'import I18n from "../services/internationalizations/i18n";\n\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {\n' +
                '    return `${I18n.t("TestScreen.TemplateElement.index(0)")}`;\n' +
                '  }\n\n' +
                '}';
            fs.writeFileSync(jsonTestFileName, '{}');
            let extractedStrings = parser.replaceStringsWithKeys(
                originalJsWithReturnStatement,
                'TestScreen.js',
                'test.json'
            );

            expect(extractedStrings).to.eql(expectedFileContent);
        });

        it('should retrieve template literal text in return statement', () => {
            let originalJsWithReturnStatement = 'import React from "react";\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {\n' +
                '   return `Today and tomorrow, ${this.test}  this mission will appear on your calendar at this time:`;\n' +
                ' }\n' +
                '}';
            fs.writeFileSync(jsonTestFileName, '{}');
            let expectedFileContent = 'import React from "react";\n' +
                'import I18n from "../services/internationalizations/i18n";\n\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {\n' +
                '    return `${I18n.t("TestScreen.TemplateElement.index(0)")}${this.test}${I18n.t("TestScreen.TemplateElement.index(1)")}`;\n' +
                '  }\n\n' +
                '}';
            fs.writeFileSync(jsonTestFileName, '{}');
            let extractedStrings = parser.replaceStringsWithKeys(
                originalJsWithReturnStatement,
                'TestScreen.js',
                'test.json'
            );

            expect(extractedStrings).to.eql(expectedFileContent);
        });

        //return `Today and tomorrow, this mission will appear on your calendar at this time:`;
        it('should retrieve text in return statement', () => {
            let originalJsWithReturnStatement = 'import React from "react";\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {\n' +
                '   return "Today and tomorrow, this mission will appear on your calendar at this time:";\n' +
                ' }\n' +
                '}';
            fs.writeFileSync(jsonTestFileName, '{}');
            let expectedFileContent = 'import React from "react";\n' +
                'import I18n from "../services/internationalizations/i18n";\n\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {\n' +
                '    return "{I18n.t(\\"TestScreen.ReturnExpression.index(0)\\")}";\n' +
                '  }\n\n' +
                '}';
            fs.writeFileSync(jsonTestFileName, '{}');
            let extractedStrings = parser.replaceStringsWithKeys(
                originalJsWithReturnStatement,
                'TestScreen.js',
                'test.json'
            );

            expect(extractedStrings).to.eql(expectedFileContent);
        });

        //return `Today and tomorrow, this mission will appear on your calendar at this time:`;
        it('should not retrieve text in return statement of calculateKeyboardType', () => {
            let originalJsWithReturnStatement = 'import React from "react";\n' +
                'class TestClass extends React.Component {\n' +
                '  calculateKeyboardType() {\n' +
                'if (keyRepresentation === "idealWeight")\n' +
                '   return "Today and tomorrow, this mission will appear on your calendar at this time:";\n' +
                ' }\n' +
                '}';
            fs.writeFileSync(jsonTestFileName, '{}');
            let expectedFileContent =
                'import React from "react";\n\n' +
                'class TestClass extends React.Component {\n' +
                '  calculateKeyboardType() {\n' +
                '    if (keyRepresentation === "idealWeight") return "Today and tomorrow, this mission will appear on your calendar at this time:";\n' +
                '  }\n\n' +
                '}';
            fs.writeFileSync(jsonTestFileName, '{}');
            let extractedStrings = parser.replaceStringsWithKeys(
                originalJsWithReturnStatement,
                'TestScreen.js',
                'test.json'
            );

            expect(extractedStrings).to.eql(expectedFileContent);
        });

        it('should retrieve text without indentation', () => {
            let originalFileContentWithATitleProp = `import React from "react";\n` +
                `import util from "utils";\n` +
                `class TestClass extends React.Component {\n` +
                `  render() {\n` +
                `    return (\n` +
                `    <View>\n` +
                `      <Text>\n` +
                `           Hello, world!\n` +
                `      </Text>\n` +
                `    </View>\n` +
                `    );\n` +
                `  }\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            let extractedStrings = parser.extractStrings(originalFileContentWithATitleProp);

            expect(extractedStrings).to.deep.contain({
                "path": "program.body.2.body.body.0.body.body.0.argument.children.1.children.0",
                "type": "JSXText",
                "value": "Hello, world!"
            });
        });
    })
});
