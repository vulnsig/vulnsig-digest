/** Central configuration — edit here to change all call sites. */
export const config = {
  glyphBaseUrl: "https://vulnsig.io/api/png",
  cveWindowHours: 24,
  cveMaxCount: 300, // limits entries sent to curation
  kevWindowDays: 7,
  kevMaxCount: 4, // infrequently updated
  // curation only applies to CVE entries
  curation: {
    cap: 8,
    diversityCap: 8,
  },
};
