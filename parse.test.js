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

        after(() => {
            let files = fs.readdirSync('output');
            for (let i = 0; i < files.length; i++) {
                fs.unlinkSync('output/' + files[i]);
            }
        });

        it('should read a js file', () => {
            let jsFileContent = 'Hello, world!';
            fs.writeFileSync(jsTestFileName, jsFileContent);

            let fileContent = parser.readJsFileContent(jsTestFileName);

            expect(fileContent).to.eql(jsFileContent);

            fs.unlinkSync(jsTestFileName);
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
            let stringType = 'JSXText';
            let modifiedFileContent = `import React from "react";\n` +
                `\n` +
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

            let jsFileContentWithReplacedKeys = parser.replaceStringsWithKeys(originalFileContentWithJSXText, 'TestScreen.js', jsonTestFileName, stringType);

            expect(jsFileContentWithReplacedKeys).to.eql(modifiedFileContent);
        });

        it('should replace the extracted ExpressionText strings with generated key', () => {
            let stringType = 'JSXExpressionContainer';
            let modifiedFileContent = `import React from "react";\n` +
                `\n` +
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

            let jsFileContentWithReplacedKeys = parser.replaceStringsWithKeys(originalFileContentWithExpressionText, 'TestScreen.js', jsonTestFileName, stringType);

            expect(jsFileContentWithReplacedKeys).to.eql(modifiedFileContent);
        });

        it('should not throw an exception when a non literal string expression container is met', () => {
            let stringType = 'JSXExpressionContainer';
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
                    jsonTestFileName,
                    stringType)
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
                    jsonTestFileName,
                    stringType)
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
                "path": "program.body.1.body.body.0.body.body.0.argument.children.3.openingElement.attributes.1.expression.value",
                "type": "JSXAttribute",
                "value": "TEST_TITLE"
            });
        });

        it('should replace texts inside title prop', () => {
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

            let expectedFileContent = `import React from "react";\n\n` +
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

            parser.replaceStringsWithKeys(originalFileContentWithATitleProp, 'TestScreen.js', jsonTestFileName, 'JSXAttribute');

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContent);
        });
    })
});
