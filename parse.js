

const babelParser = require("@babel/core");
const fs = require("fs");
const unbend = require('unbend')


exports.writeToJsonFile = (jsonFileName, fileName, extractedStrings) => {
    let fileContent = exports.readJsFileContent(jsonFileName);
    let jsonFileContent = JSON.parse(fileContent);
    for(let index = 0; index < extractedStrings.length; index+=1){
        let lineKey =  `${fileName}.${extractedStrings[index].type}.index(${index})`;
        let lineValue = `${extractedStrings[index].value}`;
        jsonFileContent[lineKey] = lineValue;
    }
    fs.writeFileSync(jsonFileName, JSON.stringify(jsonFileContent, null, 4));
};

exports.readJsFileContent = jsFileName => {
    return fs.readFileSync(jsFileName, 'utf8');
};

exports.cleanUpExtractedString = extractedString => {
    return extractedString.replace(/[\t\n]+/gm, ' ').trim();
};

function getFlatParseTree(jsFileContent) {
    let parserTree = babelParser.parse(jsFileContent, {
        presets: ["@babel/preset-react"],
        plugins: ["@babel/plugin-proposal-class-properties"]
    });
    let flatParseTree = unbend(parserTree, {separator: '.', skipFirstSeparator: true, parseArray: true});
    return flatParseTree;
}

function getAllTextComponentsValues(flatParseTree) {
    let extractedStrings = [];
    for (let [key, value] of Object.entries(flatParseTree)) {
        if (value === "JSXText") {
            let textKey = key.replace("type", "value");
            let extractedText = flatParseTree[textKey];
            extractedText = exports.cleanUpExtractedString(extractedText);
            if(extractedText.length != 0) {
                extractedStrings.push(extractedText);
            }
        }
    }
    return extractedStrings;
}

exports.extractStrings = jsFileContent => {
    let flatParseTree = getFlatParseTree(jsFileContent);
    return getAllTextComponentsValues(flatParseTree);
};


// function treeTaverseRecursive(treeJsonObject)
// {
//     for (let node in treeJsonObject)
//     {
//         if (typeof treeJsonObject[node] == "object" && treeJsonObject[node] !== null) {
//             treeTaverseRecursive(treeJsonObject[node]);
//         }
//         // do something...
//     }
// }
// let filePath = "/Users/omar/Desktop/Work/shapa-react-native/src/components/missions/ActiveMission.js";
//
// let code = fs.readFileSync(filePath, 'utf8');
// let parserOutput = babelParser.parse(code, {
//     presets: ["@babel/preset-react"],
//     plugins: ["@babel/plugin-proposal-class-properties"]
// });
// console.log(JSON.stringify(parserOutput));
