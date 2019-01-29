const fileSystemUtil = require('fs');
const walkSync = (dir, filelist) => {
  const files = fileSystemUtil.readdirSync(dir);
  filelist = filelist || [];
  files.forEach((file) => {
    if (fileSystemUtil.statSync(`${dir}/${file}`).isDirectory()) {
      filelist = walkSync(`${dir}/${file}`, filelist);
    } else {
      filelist.push(`${dir}/${file}`);
    }
  });
  return filelist;
};

module.exports = {
  walkSync,
};
