const expect = require("chai").expect;
const parser = require("./parse");
const fs = require('fs');

describe('Extract And Replace Script', () => {
    describe('Extraction', () => {
        it('should read a js file', () => {
            let jsTestFileName = 'test.js';
            fs.writeFileSync(jsTestFileName, 'Hello, world!');

            let fileContent = parser.readJsFileContent(jsTestFileName);

            expect(fileContent).to.eql('Hello, world!');
            fs.unlinkSync(jsTestFileName);
        });

        it('should read a js file without indentation', () => {
            let returnedString = parser.cleanUpExtractedString("\t\tTest\n\t\tString\n");

            expect(returnedString).to.eql("Test String");
        });

        it('should extract a string inside a Text component from a js file inside a render function', () => {
            let returnedStrings = parser.extractStrings(`import React from "react";
class TestClass extends React.Component {
  render() {
    return (
      <Text>Hello, world!</Text>
    );
  }
}`);

            expect(returnedStrings.length).to.eql(1);
            expect(returnedStrings[0]).to.eql('Hello, world!');
        });

        it('should extract strings inside a js file inside a render function', () => {
            let returnedStrings = parser.extractStrings(`import React from "react";
class TestClass extends React.Component {
  render() {
    return (
    <View>    
      <Text>Hello, world!</Text>
      <View><Text>Another Text</Text></View>
    </View>
    );
  }
}`);

            expect(returnedStrings.length).to.eql(2);
            expect(returnedStrings[0]).to.eql('Hello, world!');
            expect(returnedStrings[1]).to.eql('Another Text');
        });

        it('should write to json file with correct key', () => {
            fs.writeFileSync('test.json', '{}');
            let expectedKey = 'TestClass.JSXText.index(0)';
            let testExtractedStrings = [{
                type: 'JSXText',
                value: 'Hello, world!'
            }];

            parser.writeToJsonFile('test.json', 'TestScreen', testExtractedStrings);

            expect(fs.existsSync('test.json'));
            let jsonFileContent = fs.readFileSync('test.json', 'utf8');
            expect(jsonFileContent).to.eql('{\n    "TestScreen.JSXText.index(0)": "Hello, world!"\n}');
        });

        it('should write to json file with correct key', () => {
            fs.writeFileSync('test.json', '{\n"AnotherTestScreen.JSXText.index(0)": "Just another text"\n}');
            let expectedKey = 'TestClass.JSXText.index(0)';
            let testExtractedStrings = [{
                type: 'JSXText',
                value: 'Hello, world!'
            }];

            parser.writeToJsonFile('test.json', 'TestScreen', testExtractedStrings);

            expect(fs.existsSync('test.json'));
            let jsonFileContent = fs.readFileSync('test.json', 'utf8');
            expect(jsonFileContent).to.eql('{\n    "AnotherTestScreen.JSXText.index(0)": "Just another text",\n    "TestScreen.JSXText.index(0)": "Hello, world!"\n}');
        });
    })
});
