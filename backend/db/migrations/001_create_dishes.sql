-- Dishes managed by the dashboard.
-- dish_id is TEXT because the supplied identifiers are strings ("1", "2", ...);
-- storing them as text keeps their exact format (no lost leading zeros, no number conversion).
CREATE TABLE dishes (
  dish_id      TEXT        PRIMARY KEY,
  dish_name    TEXT        NOT NULL,
  image_url    TEXT        NOT NULL,
  is_published BOOLEAN     NOT NULL DEFAULT FALSE,
  version      INTEGER     NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT dishes_dish_id_not_blank CHECK (length(dish_id) > 0),
  CONSTRAINT dishes_version_positive  CHECK (version >= 1)
);
