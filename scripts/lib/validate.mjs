const MAX_PLAUSIBLE_RADIUS_PX = 200;

function isTransparent(color) {
  if (typeof color !== 'string') return false;
  const m = color.match(/rgba?\(([^)]+)\)/i);
  if (!m) return false;
  const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
  return parts.length === 4 && parts[3] === 0;
}

// Reports and separates. It never deletes a record — a quarantined field is
// removed from `record` and preserved in `quarantine` with its reason, so the
// raw capture stays the authority. Spec §8.
export function validateRecord(raw) {
  const record = { ...raw };
  const quarantine = [];
  const reject = (field, reason) => {
    quarantine.push({ field, value: raw[field], reason });
    delete record[field];
  };

  if (typeof raw.pageHeightPx === 'number' && typeof raw.viewportHeightPx === 'number') {
    if (raw.lazySignals && raw.pageHeightPx < raw.viewportHeightPx * 1.5) {
      reject(
        'pageHeightPx',
        'page reports lazy-loading sentinels but measured under 1.5x viewport; re-probe with a scroll-to-bottom settle',
      );
    }
  }

  if (typeof raw.ctaRadiusPx === 'number' && raw.ctaRadiusPx > MAX_PLAUSIBLE_RADIUS_PX) {
    const half = (raw.ctaSmallerDimPx ?? 0) / 2;
    if (half > 0 && raw.ctaRadiusPx >= half) {
      record.ctaRadius = 'pill';
      delete record.ctaRadiusPx;
    } else {
      reject(
        'ctaRadiusPx',
        `radius ${raw.ctaRadiusPx}px exceeds ${MAX_PLAUSIBLE_RADIUS_PX}px and does not resolve to a pill`,
      );
    }
  }

  if (isTransparent(raw.groundColor)) {
    reject('groundColor', 'ground sampled as fully transparent; the sampler must walk to a painted ancestor');
  }

  if (raw.fontFaceCount === 0 && (raw.renderedTextLength ?? 0) > 0) {
    reject('fontFaceCount', 'page rendered text but reported zero loaded faces');
  }

  // An absent hero is a measurement, not a failure. Spec §8.
  return { record, quarantine };
}
