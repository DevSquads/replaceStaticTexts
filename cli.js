#!/usr/bin/env node

const path = require('path');
const core = require('./src/core');

const main = () => {
  const rootDirectory = path.resolve(process.argv[2]);
  const jsonFilePath = path.resolve(process.argv[3]);
  core.applyParseOnDirectory(rootDirectory, jsonFilePath);
};

main();
