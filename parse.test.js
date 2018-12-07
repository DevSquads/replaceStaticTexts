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

            let expectedFileContent = `import React from "react";\n\n` +
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

            parser.replaceStringsWithKeys(originalFileContentWithATitleProp, 'TestScreen.js', jsonTestFileName, 'JSXAttribute');

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContent);
        });

        it('should not throw an exception when faced with an empty expression', () => {
            let originalFileContentWithASelfClosingElement = `import React from "react";\n` +
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

            let expectedFileContent = `import React from "react";\n\n` +
                `class TestClass extends React.Component {\n` +
                `  someObject = someCondition ? [{I18n.t("TestScreen.ConditionalExpression.index(0)")}] : [{I18n.t("TestScreen.ConditionalExpression.index(1)")}];\n\n` +
                `  render() {\n` +
                `    return <View></View>;\n` +
                `  }\n\n` +
                `}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            parser.replaceStringsWithKeys(originalFileContentWithATitleProp, 'TestScreen.js', jsonTestFileName, 'JSXAttribute');

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

            parser.replaceStringsWithKeys(originalFileContentWithARequireStatement, 'TestScreen.js', jsonTestFileName, 'JSXAttribute');

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(originalFileContentWithARequireStatement);
        });

        it('should  replace title att inside object statement', () => {
            let originalFileContentWithANAttributeInsideObject = 'import React from "react";\n\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {\n' +
                '   this.MODAL_CONTENT = {\n' +
                '       title: "Friendly Shapa reminder"\n'+
                '  }\n' +
                ' }\n' +
                '}';
            let expectedFileContentWithANAttributeInsideObject = 'import React from "react";\n\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {\n' +
                '    this.MODAL_CONTENT = {\n' +
                '      title: I18n.t("TestScreen.ObjectProperty.index(0)")\n'+
                '    };\n' +
                '  }\n\n' +
                '}';

            fs.writeFileSync('TestScreen.js', originalFileContentWithANAttributeInsideObject);
            fs.writeFileSync(jsonTestFileName, '{}');

            parser.replaceStringsWithKeys(originalFileContentWithANAttributeInsideObject, 'TestScreen.js', jsonTestFileName, 'JSXAttribute');

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContentWithANAttributeInsideObject);
        });

        it('should not replace style values', () => {
            let fileContentWithStyleValues = 'import React from "react";\n' +
                'const styles = StyleSheet.create({\n' +
                '  button: {\n' +
                '    justifyContent: "center"\n' +
                '  }\n' +
                '});\n\n'+
                'class TestClass extends React.Component {\n' +
                '  render() {}\n\n' +
                '}';

            fs.writeFileSync('TestScreen.js', fileContentWithStyleValues);
            fs.writeFileSync(jsonTestFileName, '{}');

            parser.replaceStringsWithKeys(fileContentWithStyleValues, 'TestScreen.js', jsonTestFileName, 'JSXAttribute');

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(fileContentWithStyleValues);
        });

        it('should replace text inside function call', () => {
            let originalFileContentWithANAttributeInsideObject = 'import React from "react";\n\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {\n' +
                '   CalendarUtil.schedule("Renew your Shapa subscription", options);\n' +
                '  }\n' +
                '}';
            let expectedFileContentWithANAttributeInsideObject = 'import React from "react";\n\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {\n' +
                '    CalendarUtil.schedule(I18n.t("TestScreen.CallExpression.index(0)"), options);\n' +
                '  }\n\n' +
                '}';

            fs.writeFileSync('TestScreen.js', originalFileContentWithANAttributeInsideObject);
            fs.writeFileSync(jsonTestFileName, '{}');

            parser.replaceStringsWithKeys(originalFileContentWithANAttributeInsideObject, 'TestScreen.js', jsonTestFileName, 'JSXAttribute');

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContentWithANAttributeInsideObject);
        });

        it('should extract text from function call and object title with' +
            ' zero index for difference type', () => {
            let originalFileContentWithANAttributeInsideObject = 'import React from "react";\n\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {\n' +
                '   CalendarUtil.schedule("Renew your Shapa subscription", options);\n' +
                '   CalendarUtil.schedule("Renew your Shapa subscription", options);\n' +
                '    this.MODAL_CONTENT = {\n' +
                '      title: "Shapa title",\n'+
                '      title: "Shapa title(1)"\n'+

                '    };\n' +
                '  }\n' +
                '}';
            let expectedFileContentWithANAttributeInsideObject = 'import React from "react";\n\n' +
                'class TestClass extends React.Component {\n' +
                '  render() {\n' +
                '    CalendarUtil.schedule(I18n.t("TestScreen.CallExpression.index(0)"), options);\n' +
                '    CalendarUtil.schedule(I18n.t("TestScreen.CallExpression.index(1)"), options);\n' +
                '    this.MODAL_CONTENT = {\n' +
                '      title: I18n.t("TestScreen.ObjectProperty.index(0)"),\n'+
                '      title: I18n.t("TestScreen.ObjectProperty.index(1)")\n'+
                '    };\n' +
                '  }\n\n' +
                '}';

            fs.writeFileSync('TestScreen.js', originalFileContentWithANAttributeInsideObject);
            fs.writeFileSync(jsonTestFileName, '{}');

            parser.replaceStringsWithKeys(originalFileContentWithANAttributeInsideObject, 'TestScreen.js', jsonTestFileName, 'JSXAttribute');

            expect(parser.readJsFileContent('output/TestScreen.js')).to.eql(expectedFileContentWithANAttributeInsideObject);
        });

    })
});
