-- =============================================================================
-- 0003 — Insignias estilo carta: campos subtitle y category_label
-- =============================================================================

ALTER TABLE badges ADD COLUMN IF NOT EXISTS subtitle text;
ALTER TABLE badges ADD COLUMN IF NOT EXISTS category_label text;
