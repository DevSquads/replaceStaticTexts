/* globals describe it afterEach before after */
/* eslint no-template-curly-in-string: 0
          prefer-destructuring: 0
*/
const expect = require('chai').expect;
const path = require('path');
const fs = require('fs');
const App = require('../app');

describe('application entry point', () => {
  it('should find the javascript files in directory ', () => {
    // create directory with files
    const dirPath = path.resolve('./test');
    const newFilePath = path.resolve(dirPath, 'test1.js');
    const nonJavascriptFilePath = path.resolve(dirPath, 'nonJavascript.xml');
    try {
      fs.mkdirSync(dirPath);
      fs.writeFileSync(newFilePath, 'w+');
      fs.writeFileSync(nonJavascriptFilePath, 'w+');
    } catch (err) {
      console.log(err);
    }
    // run walksync
    const returnedFileList = App.walkSync(dirPath);
    // expect
    expect(returnedFileList.length).to.eql(5);

    fs.unlinkSync(newFilePath);
    fs.unlinkSync(nonJavascriptFilePath);
    fs.rmdirSync(dirPath);
  });
});
