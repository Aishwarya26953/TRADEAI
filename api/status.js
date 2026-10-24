export const access = "public";
export const methods = ["GET"];

export default async function (req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.json({
    api: { status: "reachable" },
    market_session: "UNVERIFIED",
    market_data: {
      status: "not_configured",
      message: "No authorized market-data provider has been configured for this hosted TRADEAI workspace. No prices are served.",
      last_verified_at: null,
      provider_verified: false
    },
    ai: {
      status: "not_ready",
      message: "No eligible dataset provenance or active model has been verified in this hosted workspace. Signal generation is disabled.",
      ready: false,
      dataset_eligible: false,
      model_verified: false
    },
    broker: {
      status: "not_configured",
      message: "The uploaded FastAPI/Upstox backend is not running inside this Hatchable project. Broker identity and authorization have not been verified."
    },
    live_trading: {
      enabled: false,
      reason: "No verified broker adapter, order risk gate, idempotency and reconciliation workflow is deployed in this hosted workspace."
    },
    backtesting: {
      enabled: false,
      reason: "Eligible historical market data and cost assumptions have not been verified."
    },
    generated_at: new Date().toISOString()
  });
}