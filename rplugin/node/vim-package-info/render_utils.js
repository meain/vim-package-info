const diff = require("./diff");

function isStart(line, depMarkers) {
  // for requirements.txt
  if (depMarkers === null) return { depGroupName: null, end: null };

  for (let i = 0; i < depMarkers.length; i++) {
    const dm = depMarkers[i];
    const depGroup = line.match(dm[0]);
    if (depGroup !== undefined && depGroup !== null) {
      return { depGroupName: depGroup[1], end: dm[1] };
    }
  }
  return false;
}

function getDepLine(lines, depMarkers, nameRegex, name) {
  let start = false;
  let end = false;
  for (let i = 0; i < lines.length; i++) {
    if (start) {
      if (end && end !== null && end.test(lines[i])) {
        start = false;
        end = false;
      }

      const vals = lines[i].match(nameRegex);
      if (vals !== null && vals !== undefined && 1 in vals && vals[1].trim() === name.trim())
        return i;
      //eslint-disable-next-line
    } else if (!!isStart(lines[i], depMarkers)) {
      start = true;
      end = isStart(lines[i], depMarkers).end;
    }
  }
  return null;
}

function format(current, prefix, hl, latest, vulnerable = false) {
  // let lpf = [[`${prefix}No info available`, hl]];
  let lpf = [["", hl]];
  const cd = diff.colorizeDiff(current, latest, hl);

  if (vulnerable) lpf = [["   ", hl], [" vulnerable ", "VimPackageInfoVulnerable"], ...cd];
  else lpf = [[`${prefix} `, hl], ...cd];

  return lpf;
}

module.exports = { getDepLine, format };
