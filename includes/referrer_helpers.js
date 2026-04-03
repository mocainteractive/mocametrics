/**
 * referrer_helpers.js
 * MOCA Interactive — Bofrost Analytics Pipeline
 *
 * Centralizza la logica di priorità del referrer come macro JS riutilizzabile.
 * Usato da int_referrer_resolution per generare il CASE SQL senza duplicazioni.
 */

/**
 * Genera un CASE WHEN SQL BigQuery che seleziona il referrer migliore
 * secondo la gerarchia: session_first > session_best > visit_first > visit_best,
 * con preferenza per referrer contenenti parametri di tracking (utm_, gclid, fbclid).
 *
 * @returns {string} frammento SQL CASE WHEN
 */
function bestReferrerCase() {
  const sources = [
    "session_first_referrer",
    "session_best_referrer",
    "visit_first_referrer",
    "visit_best_referrer"
  ];

  const trackingPattern = `(?i)(utm_|gclid|fbclid)`;
  const internalPattern = `bofrost\\.it`;

  let caseParts = [];

  // Prima passata: solo referrer con tracking params e non interni
  for (const src of sources) {
    caseParts.push(
      `      WHEN ${src} IS NOT NULL\n` +
      `        AND TRIM(${src}) != ''\n` +
      `        AND NOT REGEXP_CONTAINS(LOWER(${src}), r'${internalPattern}')\n` +
      `        AND REGEXP_CONTAINS(${src}, r'${trackingPattern}')\n` +
      `      THEN ${src}`
    );
  }

  // Seconda passata (fallback): qualsiasi referrer non vuoto
  for (const src of sources) {
    caseParts.push(
      `      WHEN ${src} IS NOT NULL AND TRIM(${src}) != ''\n` +
      `      THEN ${src}`
    );
  }

  return `CASE\n${caseParts.join("\n")}\n      ELSE NULL\n    END`;
}

module.exports = { bestReferrerCase };
