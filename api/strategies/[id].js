import { db } from "hatchable";

export const access = "user";
export const methods = ["DELETE"];

export default async function (req, res) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid strategy ID." });
  }
  const result = await db.query(
    "DELETE FROM tradeai_strategies WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, String(req.user.id)]
  );
  if (!result.rows.length) {
    return res.status(404).json({ error: "Strategy not found." });
  }
  return res.json({ deleted: true, id });
}