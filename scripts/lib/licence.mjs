// True when a record row names a licence that needs credit (CC BY, "attribution required", ...).
export function licenceNeedsCredit(row) {
  const lic = row
    // URLs are not licence text: "https://x.com/cc-by/a.jpg" is a path, not CC BY.
    .replace(/https?:\/\/\S+/gi, '')
    // Remove negated phrases next, so "no attribution required" is not read as "attribution required".
    .replace(/(no|not|without)\s+(attribution|credit)(\s+(is\s+)?(required|needed))?|(attribution|credit)\s+(is\s+)?not\s+(required|needed)|(does|do)\s+not\s+require\s+(attribution|credit)|(attribution|credit)\s+(is\s+)?(required|needed)\s*:\s*no\b/gi, '');
  return /\bCC[ -]?BY\b(?![- ]?0)|attribution required|credit required|requires? (attribution|credit)/i.test(lic);
}
