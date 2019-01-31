const babelParser = require('@babel/core');

class Parser {
  set jsContent(jsFileContent) {
    this.jsFileContent = jsFileContent;
  }

  writeImportStatementToJSContent() {
    if (this.jsFileContent.includes('import I18n')) {
      return this.jsFileContent;
    }
    const fileLines = this.jsFileContent.split('\n');
    for (let index = fileLines.length - 1; index >= 0; index -= 1) {
      if (fileLines[index].startsWith('import')) {
        fileLines.splice(index + 1, 0, 'import I18n from "../services/internationalizations/i18n";');
        break;
      }
    }
    return fileLines.join('\n');
  }

  getParsedTree() {
    return babelParser.parse(this.jsFileContent, {
      presets: ['@babel/preset-react'],
      plugins: ['@babel/plugin-proposal-class-properties'],
    });
  }
}

module.exports = Parser;
