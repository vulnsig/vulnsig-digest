/** Central configuration — edit here to change all call sites. */
export const config = {
  glyphBaseUrl: "https://vulnsig.io/api/png",
  cveWindowHours: 24,
  cveMaxCount: 200,
  kevWindowDays: 7,
  kevMaxCount: 50,
  curation: {
    cap: 10,
    diversityCap: 10,
  },
};
