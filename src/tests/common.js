/* eslint no-template-curly-in-string: 0
          prefer-destructuring: 0
*/
const expect = require('chai').expect;
const fs = require('fs');
const Parser = require('../Parser');
const parser = require('../parse');

const testFileName = 'TestScreen.js';

const parserObject = new Parser();


const jsonKeysFile = 'test.json';

const getOriginalFileContent = renderContent => `${'import React from "react";\n'
+ 'class TestClass extends React.Component {\n'}${
  renderContent
}  }\n`;

const getModifiedFileContent = modifiedRenderContent => `${'import React from "react";\n'
+ 'import I18n from "../services/internationalizations/i18n";\n\n'
+ 'class TestClass extends React.Component {\n'}${
  modifiedRenderContent
}}`;


function testParsedFileWithExpectedContent(originalInput, expectedOutput) {
  fs.writeFileSync(jsonKeysFile, '{}');

  let jsFileContentWithReplacedKeys = parser
    .replaceStringsWithKeys(originalInput,
      testFileName, jsonKeysFile);
  parserObject.jsContent = jsFileContentWithReplacedKeys;
  jsFileContentWithReplacedKeys = parserObject.writeImportStatementToJSContent();

  expect(jsFileContentWithReplacedKeys).to.eql(expectedOutput);
}

module.exports = {
  getOriginalFileContent,
  getModifiedFileContent,
  testParsedFileWithExpectedContent,
  testFileName,
  jsonKeysFile,

};
