const expect = require("chai").expect;
const parser = require("./parse");
const fs = require('fs');

describe('Extract And Replace Script', () => {
    describe('Extraction', () => {
        let originalFileContent = `import React from "react";
class TestClass extends React.Component {
  render() {
    return (
    <View>    
      <Text>Hello, world!</Text>
      <View><Text>Another Text</Text></View>
    </View>
    );
  }
}`;
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
        it('should read a js file', () => {
            let jsFileContent = 'Hello, world!';
            fs.writeFileSync(jsTestFileName, jsFileContent);

            let fileContent = parser.readJsFileContent(jsTestFileName);

            expect(fileContent).to.eql(jsFileContent);

            fs.unlinkSync(jsTestFileName);
        });

        it('should read a js file without indentation', () => {
            let returnedString = parser.cleanUpExtractedString("\t\tTest\n\t\tString\n");
            expect(returnedString).to.eql("Test String");
        });

        it('should extract a string inside a Text component from a js file inside a render function', () => {
            let jsFileContent = `import React from "react";
class TestClass extends React.Component {
  render() {
    return (
      <Text>Hello, world!</Text>
    );
  }
}`;
            let returnedStrings = parser.extractStrings(jsFileContent);

            expect(returnedStrings.length).to.eql(1);
            expect(returnedStrings[0]).to.eql({
                path: 'program.body.1.body.body.0.body.body.0.argument.children.0',
                type: 'JSXText',
                value: 'Hello, world!'
            });
        });

        it('should extract strings inside a js file inside a render function', () => {
            let returnedStrings = parser.extractStrings(originalFileContent);

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

        it('should replace the extracted jsx strings with generated key', () => {
            let modifiedFileContent = `import React from "react";

class TestClass extends React.Component {
  render() {
    return <View>    
      <Text>{I18n.t("TestScreen.JSXText.index(0)")}</Text>
      <View><Text>{I18n.t("TestScreen.JSXText.index(1)")}</Text></View>
    </View>;
  }

}`;
            fs.writeFileSync(jsonTestFileName, '{}');

            let jsFileContentWithReplacedKeys = parser.replaceJsxStringsWithKeys(originalFileContent, 'TestScreen.js', jsonTestFileName);

            expect(jsFileContentWithReplacedKeys).to.eql(modifiedFileContent);
        });

    })
});
