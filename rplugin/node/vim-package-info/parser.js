// Format:
// [ [start, end], [start, end] ]
const depMarkers = {
  "package.json": [
    [/["|']dependencies["|']/, /\}/],
    [/["|']devDependencies["|']/, /\}/]
  ],
  "Cargo.toml": [[/\[.*dependencies\]/, /\[.*\]/]]
};
const nameParserRegex = {
  "package.json": /['|"](.*)['|"] *:/,
  "Cargo.toml": /(.*) *=.*/
};
const versionParserRegex = {
  "package.json": /: *['|"](.*)['|"]/,
  "Cargo.toml": /.*=.*['|"](.*)['|"].*/
};

function isStart(line, confType) {
  for (let i = 0; i < depMarkers[confType].length; i++) {
    const dm = depMarkers[confType][i];
    if (dm[0].test(line)) {
      return dm[1];
    }
  }
  return false;
}

function getDepLines(bf, confType) {
  let spos = -1;
  let epos = -1;
  let groups = [];
  for (let i = 0; i < bf.length; i++) {
    const end = isStart(bf[i], confType);
    if (end) {
      spos = i;
      for (let j = i + 1; j < bf.length; j++) {
        if (end.test(bf[j])) {
          epos = j;
          break;
        }
      }
      groups.push([spos + 1, epos + 1]);
      spos = -1;
      epos = -1;
    }
  }
  return groups;
}

function getPackageInfo(line, confType) {
  const info = { name: undefined, version: undefined };

  const re = nameParserRegex[confType];
  const vals = re.exec(line);
  if (vals && 1 in vals) info["name"] = vals[1];

  const re2 = versionParserRegex[confType];
  const vals2 = re2.exec(line);
  if (vals2 && 1 in vals2) info["version"] = vals2[1];

  return info;
}

module.exports = { getDepLines, getPackageInfo };
