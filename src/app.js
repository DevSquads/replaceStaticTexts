const fileSystemUtil = require('fs');

const walkSync = (dir, fileList) => {
  const files = fileSystemUtil.readdirSync(dir);
  files.forEach((file) => {
    if (fileSystemUtil.statSync(`${dir}/${file}`).isDirectory()) {
      fileList = walkSync(`${dir}/${file}`, fileList);
    } else {
      fileList.push(`${dir}/${file}`);
    }
  });
  return fileList;
};

module.exports = {
  walkSync,
};
