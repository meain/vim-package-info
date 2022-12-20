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

function getDepLines(lines, depMarkers, nameRegex, name, end_maybe_start_of_next = false) {
  let start = depMarkers === null ? true : false;
  let end = false;
  let depLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (start) {
      if (end && end !== null && end.test(lines[i])) {
        start = false;
        end = false;
        if (end_maybe_start_of_next) --i;
      }

      const vals = lines[i].match(nameRegex);
      if (
        vals !== null &&
        vals !== undefined &&
        1 in vals &&
        vals[1] !== null &&
        vals[1].trim() === name.trim()
      ) {
        depLines.push(i);
      }
      //eslint-disable-next-line
    } else if (!!isStart(lines[i], depMarkers)) {
      start = true;
      end = isStart(lines[i], depMarkers).end;
    }
  }
  return depLines;
}

function format(current, prefix, hl, latest, vulnerable = false) {
  // let lpf = [[`${prefix}No info available`, hl]];
  let lpf = [["", hl]];
  const cd = diff.colorizeDiff(current, latest, hl);

  if (vulnerable)
    lpf = [["   ", hl], [" vulnerable ", "VimPackageInfoVulnerable"], [" ", hl], ...cd];
  else lpf = [[`${prefix} `, hl], ...cd];

  return lpf;
}

module.exports = { getDepLines, format };
