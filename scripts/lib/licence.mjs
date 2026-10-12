// True when a record row names a licence that needs credit. A block list, not an allow list: anything that mentions
// attribution or credit, or names a Creative Commons "BY" licence, needs credit unless the text says it does not.
const CC_BY_URL = /creativecommons\.org\/licenses\/by/i;

const NEGATED = new RegExp([
  // "no attribution (required)", "not credit", "without attribution"
  String.raw`\b(?:no|not|without)\s+(?:attribution|credit)(?:\s+(?:is\s+)?(?:required|needed))?`,
  // "attribution (is) not required", "credit not needed"
  String.raw`(?:attribution|credit)\s+(?:is\s+)?not\s+(?:required|needed|necessary)`,
  // "does not require attribution", "doesn't require credit", "don't require attribution"
  String.raw`(?:does|do)(?:\s+not|n['’]t)\s+require\s+(?:attribution|credit)`,
  // "attribution required: no"
  String.raw`(?:attribution|credit)\s+(?:is\s+)?(?:required|needed)\s*:\s*no\b`,
  // "attribution optional", "credit unnecessary"
  String.raw`(?:attribution|credit)\s+(?:is\s+)?(?:optional|unnecessary)`,
].join('|'), 'gi');

const NEEDS_CREDIT = new RegExp([
  String.raw`\bCC[ -]?BY\b(?![- ]?0)`, // CC BY, CC-BY-SA, CC BY-NC 4.0 (not CC0)
  String.raw`\bby-(?:nc-)?(?:sa|nd)\b`,
  String.raw`\bby-nc\b`,
  String.raw`\bcreative\s+commons\s+(?:attribution|by)\b`,
  String.raw`\battribution\b`, // "Attribution 4.0 International", "attribution needed", "Free with attribution"
  String.raw`\bcredit(?:s|ed|ing)?\b`, // "credit the photographer", "Credit: Jane Doe", "Give credit", "Requires crediting the author"
  String.raw`\bphotographer\s+credit\b`,
  String.raw`\brequires?\s+credit\b`,
].join('|'), 'i');

export function licenceNeedsCredit(row) {
  // A Creative Commons BY licence page is a licence, whatever the cell around it says; read it before URLs are dropped.
  if (CC_BY_URL.test(row)) return true;
  const lic = row
    // Other URLs are not licence text: "https://x.com/cc-by/a.jpg" is a path, not CC BY.
    .replace(/https?:\/\/[^\s|]+/gi, '')
    // Negated phrases next, so "no attribution required" is not read as "attribution required".
    .replace(NEGATED, '');
  return NEEDS_CREDIT.test(lic);
}

// A licence cell that says nothing: empty, TBD / TBC, a dash, n/a, N.A., "none", a question mark. It is not a recorded licence.
export function licenceIsPlaceholder(cell) {
  const text = String(cell).toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
  return /^(?:tbd|tba|tbc|todo|n\/?a|none|unknown|pending|[-–—?…\s]*)$/.test(text);
}
