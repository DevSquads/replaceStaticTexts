const fileSystemUtil = require('fs');
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
//
// function main() {
//   const dirPath = '/Users/omar/Desktop/Work/shapa-react-native/src/utils';
//   if (!fileSystemUtil.existsSync('output')) {
//     fileSystemUtil.mkdirSync('output');
//   }
//   const files = findAllJSFilesInADirectory(dirPath, []);
//
//
//   files.forEach((jsFilePath) => {
//     if (jsFilePath.endsWith('.js') && !jsFilePath.endsWith('LanguageSetting.js') && !jsFilePath.endsWith('App.js') && !jsFilePath.toUpperCase().includes('DEPRECATED')) {
//       const jsFileName = `${jsFilePath.split('/').reverse()[1]}_${jsFilePath.split('/').reverse()[0]}`;
//       const jsonFilePath = './en.json';
//       const jsFileContent = parser.readJsFileContent(jsFilePath);
//       parser.replaceStringsWithKeys(jsFileContent, jsFileName, jsonFilePath, jsFilePath);
//     }
//   });
// }
//
// main();
