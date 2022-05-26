const fs = require('fs');

const write = (path, data) => {
  
  const dir = path.substring(0, path.lastIndexOf("/"));
  const exists = fs.existsSync(dir);
  if (!exists) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(path, json);

}

const read = (path, defaultValue) => {
  try {
    const raw = fs.readFileSync(path, 'utf8');
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

const getFilesInDirectory = (dir) => {

  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }

}

module.exports = { read, write, getFilesInDirectory }
