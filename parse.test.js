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
    })
});
