import { db } from "hatchable";

export const access = "user";
export const methods = ["GET", "POST"];

export default async function (req, res) {
  const userId = String(req.user.id);
  if (req.method === "GET") {
    const result = await db.query(
      "SELECT id, symbol, exchange, note, created_at FROM tradeai_watchlists WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 200",
      [userId]
    );
    return res.json({ items: result.rows });
  }

  const body = req.body || {};
  const symbol = String(body.symbol || "").trim().toUpperCase();
  const exchange = String(body.exchange || "NSE").trim().toUpperCase();
  const note = String(body.note || "").trim().slice(0, 160);
  if (!/^[A-Z0-9._:-]{1,24}$/.test(symbol)) {
    return res.status(400).json({ error: "Enter a valid trading symbol (1–24 letters, numbers or . _ : -)." });
  }
  if (!["NSE", "BSE", "NFO", "BFO", "MCX"].includes(exchange)) {
    return res.status(400).json({ error: "Unsupported exchange selection." });
  }

  const result = await db.query(
    "INSERT INTO tradeai_watchlists (user_id, symbol, exchange, note) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, symbol, exchange) DO UPDATE SET note = EXCLUDED.note RETURNING id, symbol, exchange, note, created_at",
    [userId, symbol, exchange, note || null]
  );
  return res.status(201).json({ item: result.rows[0] });
}