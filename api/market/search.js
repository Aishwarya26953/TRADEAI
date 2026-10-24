export const access = "public";
export const methods = ["GET"];

export default async function (req, res) {
  const symbol = String((req.query || {}).symbol || "").trim().toUpperCase();
  if (!symbol || !/^[A-Z0-9._:-]{1,24}$/.test(symbol)) {
    return res.status(400).json({ status: "invalid_query", error: "Enter a valid instrument symbol." });
  }
  res.setHeader("Cache-Control", "no-store");
  return res.status(503).json({
    status: "not_configured",
    symbol,
    error: "Instrument search is unavailable because no authorized market-data provider is configured for this hosted TRADEAI workspace. No substitute or sample quote was returned."
  });
}