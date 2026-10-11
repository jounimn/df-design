// True when a record row names a licence that needs credit (CC BY and its variants, "attribution required", ...).
export function licenceNeedsCredit(row) {
  const lic = row
    // URLs are not licence text: "https://x.com/cc-by/a.jpg" is a path, not CC BY.
    .replace(/https?:\/\/[^\s|]+/gi, '')
    // Remove negated phrases next, so "no attribution required" is not read as "attribution required".
    .replace(/(no|not|without)\s+(attribution|credit)(\s+(is\s+)?(required|needed))?|(attribution|credit)\s+(is\s+)?not\s+(required|needed)|(does|do)(\s+not|n['’]t)\s+require\s+(attribution|credit)|(attribution|credit)\s+(is\s+)?(required|needed)\s*:\s*no\b/gi, '');
  return /\bCC[ -]?BY\b(?![- ]?0)|\bby-(?:nc-)?(?:sa|nd)\b|\bby-nc\b|creative\s+commons\s+attribution|attribution[- ](?:share[- ]?alike|non[- ]?commercial|no[- ]?deriv)|attribution required|credit required|requires? (attribution|credit)/i.test(lic);
}
