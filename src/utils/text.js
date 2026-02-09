//To manipulate strings
function escapeRegex(text) {
  if (typeof text !== "string") {
    throw new Error(`escapeRegex expects a string, got ${typeof text}`);
  }

  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(text) {
  if (typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim();
}

function caseInsensitiveContains(text) {
  return new RegExp(escapeRegex(text), "i");
}

module.exports = {
  escapeRegex,
  normalizeText,
  caseInsensitiveContains,
};
