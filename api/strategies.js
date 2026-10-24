import { db } from "hatchable";

export const access = "user";
export const methods = ["GET", "POST"];

export default async function (req, res) {
  const userId = String(req.user.id);
  if (req.method === "GET") {
    const result = await db.query(
      "SELECT id, name, symbol, timeframe, rules, created_at, updated_at FROM tradeai_strategies WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 100",
      [userId]
    );
    return res.json({ items: result.rows });
  }

  const body = req.body || {};
  const name = String(body.name || "").trim().slice(0, 80);
  const symbol = String(body.symbol || "").trim().toUpperCase();
  const timeframe = String(body.timeframe || "").trim();
  const rules = String(body.rules || "").trim().slice(0, 800);
  if (!name || name.length > 80) {
    return res.status(400).json({ error: "Strategy name is required (up to 80 characters)." });
  }
  if (!/^[A-Z0-9._:-]{1,24}$/.test(symbol)) {
    return res.status(400).json({ error: "Enter a valid trading symbol." });
  }
  if (!["1d", "1h", "15m", "5m"].includes(timeframe)) {
    return res.status(400).json({ error: "Unsupported strategy timeframe." });
  }
  if (!rules) {
    return res.status(400).json({ error: "Describe the entry, exit and risk assumptions." });
  }

  const result = await db.query(
    "INSERT INTO tradeai_strategies (user_id, name, symbol, timeframe, rules) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, symbol, timeframe, rules, created_at, updated_at",
    [userId, name, symbol, timeframe, rules]
  );
  return res.status(201).json({ item: result.rows[0], execution: { status: "not_run", reason: "This endpoint stores a strategy specification only. It does not execute a backtest or place orders." } });
}