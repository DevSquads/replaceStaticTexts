/* globals describe it */
/* eslint no-template-curly-in-string: 0
          prefer-destructuring: 0
*/
const expect = require('chai').expect;
const path = require('path');
const fs = require('fs');
const App = require('../app');

describe('application entry point', () => {
  it('should find the javascript files in directory ', () => {
    const dirPath = path.resolve('./test');
    const newFilePath = path.resolve(dirPath, 'test1.js');
    const nonJavascriptFilePath = path.resolve(dirPath, 'nonJavascript.xml');
    const secondLevelDirectoryPath = `${dirPath}/second_level`;
    const secondLevelDirectoryJSFilePath = `${secondLevelDirectoryPath}/test2.js`;
    try {
      fs.mkdirSync(dirPath);
      fs.mkdirSync(secondLevelDirectoryPath);
      fs.writeFileSync(newFilePath, 'w+');
      fs.writeFileSync(secondLevelDirectoryJSFilePath, 'w+');
      fs.writeFileSync(nonJavascriptFilePath, 'w+');
    } catch (err) {
      console.log(err);
    }

    const returnedFileList = App.findAllJSFilesInADirectory(dirPath);

    expect(returnedFileList.length).to.eql(2);

    fs.unlinkSync(newFilePath);
    fs.unlinkSync(nonJavascriptFilePath);
    fs.unlinkSync(secondLevelDirectoryJSFilePath);
    fs.rmdirSync(secondLevelDirectoryPath);
    fs.rmdirSync(dirPath);
  });
});
