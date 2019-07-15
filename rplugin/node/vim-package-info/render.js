const utils = require("./utils");
const rutils = require("./render_utils");

async function clearAll(handle) {
  await handle.nvim.buffer.clearNamespace({ nsId: 1 });
}

async function drawOne(handle, lineNum, current, latest, vulnerable) {
  const { prefix, hl_group } = await utils.getConfigValues(handle);
  const lp = rutils.format(current, prefix, hl_group, latest, vulnerable);

  const buffer = await handle.nvim.buffer;
  await buffer.setVirtualText(1, lineNum, lp);
}

module.exports = { clearAll, drawOne };
