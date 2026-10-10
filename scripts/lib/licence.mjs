// True when a record row names a licence that needs credit (CC BY, "attribution required", ...).
export function licenceNeedsCredit(row) {
  // Remove negated phrases first, so "no attribution required" is not read as "attribution required".
  const lic = row.replace(/(no|not|without)\s+(attribution|credit)(\s+(is\s+)?(required|needed))?|(attribution|credit)\s+(is\s+)?not\s+(required|needed)/gi, '');
  return /\bCC[ -]?BY\b(?![- ]?0)|attribution required|credit required|requires? (attribution|credit)/i.test(lic);
}
