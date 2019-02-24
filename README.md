# Textractor-react  &middot; [![Circle CI Status](https://circleci.com/gh/DevSquads/replaceStaticTexts.svg?style=shield)](https://circleci.com/gh/DevSquads/replaceStaticTexts) [![npm version](https://badge.fury.io/js/textractor-react.svg)](https://badge.fury.io/js/textractor-react) 

Extracting and replacing texts for internationalization is a tedious task with a lot of manual work that is prone to human error. Using this script saves you all that work and removes human error completely.

## What does this project do?

Textractor-react is a script that helps you extract translatable text in your Javascript project and optionally replace them with I18n method calls

## How to use?

 * Install the library globally by using `npm install -g textractor-react`.
 * To apply the Textract Just use `textract [filePath/Directory] [jsonFile]`
 * This will find the static strings inside the file and add them inside the jsonFile with format `Key: "String"`
 * The Static string in the Component will be replaced with the `I18n.t("Key")`.

## WELCOME!

We're so glad you're thinking about contributing to Textractor-react! If you're unsure about anything, just ask -- or submit the issue or pull request anyway. The worst that can happen is you'll be politely asked to change something. We love all friendly contributions.

We want to ensure that all of our projects have a welcoming environment for all contributors. Our team follows the Contributor Covenant [Code of Conduct](https://github.com/DevSquads/replaceStaticTexts/blob/master/CODE_OF_CONDUCT) and all contributors should do the same.

We encourage you to read this project's [CONTRIBUTING](https://github.com/DevSquads/replaceStaticTexts/blob/master/CONTRIBUTING.md) policy, and its [LICENSE](https://github.com/DevSquads/replaceStaticTexts/blob/master/LICENSE).


## How do I get started for contributing?

Just clone this repo
`git clone https://github.com/DevSquads/replaceStaticTexts.git` .  
Install the needed packages with `npm install` .
Use `npm test` to run the tests .
Use `node main.js path/to/dictionary.json path/to/your/project/src` to apply our script .  

## Where can I get more help, if I need it?

You can contact us on info@devsquads.com
