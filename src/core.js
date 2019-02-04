const fileSystemUtil = require('fs');
const path = require('path');
const parser = require('./parse');

const findAllJSFilesInADirectory = (dir) => {
  const files = fileSystemUtil.readdirSync(dir);
  const fileList = [];
  files.forEach((file) => {
    if (fileSystemUtil.statSync(`${dir}/${file}`).isDirectory()) {
      fileList.push(...findAllJSFilesInADirectory(`${dir}/${file}`));
    } else if (file.endsWith('.js')) {
      fileList.push(`${dir}/${file}`);
    }
  });
  return fileList;
};

const applyParseOnDirectory = (dir, jsonFilePath) => {
  const filePathList = findAllJSFilesInADirectory(dir);

  filePathList.forEach((filePath) => {
    const jsFileContent = parser.readJsFileContent(filePath);
    const jsFileName = `${filePath.split('/').reverse()[1]}_${filePath.split('/').reverse()[0]}`;
    parser.replaceStringsWithKeys(jsFileContent, jsFileName, jsonFilePath, filePath);
  });
};

module.exports = {
  findAllJSFilesInADirectory,
  applyParseOnDirectory,
};
