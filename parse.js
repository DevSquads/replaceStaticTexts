const babelParser = require("@babel/core");
const fs = require("fs");

exports.readJsFileContent = jsFileName => {
    return fs.readFileSync(jsFileName, 'utf8');
};

exports.cleanUpExtractedString = extractedString => {
    return extractedString.replace(/[\t\n]+/gm, ' ').trim();
};



// let filePath = "/Users/omar/Desktop/Work/shapa-react-native/src/components/missions/ActiveMission.js";
//
// let code = fs.readFileSync(filePath, 'utf8');
// let parserOutput = babelParser.parse(code, {
//     presets: ["@babel/preset-react"],
//     plugins: ["@babel/plugin-proposal-class-properties"]
// });
// console.log(JSON.stringify(parserOutput));
