export const access = "public";
export const methods = ["GET"];

export default async function (req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.json({
    ready: false,
    status: "blocked",
    checks: [
      { name: "Authorized market data", status: "not_verified" },
      { name: "Historical dataset provenance", status: "not_verified" },
      { name: "Leakage-safe model evaluation", status: "not_verified" },
      { name: "Active model artifact", status: "not_verified" },
      { name: "Personal broker authorization", status: "not_verified" },
      { name: "Live order reconciliation", status: "not_deployed" }
    ],
    message: "This hosted TRADEAI workspace does not yet run the uploaded FastAPI backend. Signals, historical backtesting and live order submission remain disabled until the actual backend and authorized integrations are deployed and verified."
  });
}