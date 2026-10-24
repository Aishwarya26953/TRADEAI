CREATE TABLE tradeai_watchlists (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL DEFAULT 'NSE',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, symbol, exchange)
);
CREATE INDEX tradeai_watchlists_user_idx ON tradeai_watchlists(user_id, created_at DESC);