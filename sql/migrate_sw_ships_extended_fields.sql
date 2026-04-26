BEGIN;

ALTER TABLE "SW_ships"
  ADD COLUMN IF NOT EXISTS "defence_fore" INTEGER,
  ADD COLUMN IF NOT EXISTS "defence_port" INTEGER,
  ADD COLUMN IF NOT EXISTS "defence_starboard" INTEGER,
  ADD COLUMN IF NOT EXISTS "defence_aft" INTEGER,
  ADD COLUMN IF NOT EXISTS "manufacturer" TEXT,
  ADD COLUMN IF NOT EXISTS "hyperdrive_primary" TEXT,
  ADD COLUMN IF NOT EXISTS "hyperdrive_backup" TEXT,
  ADD COLUMN IF NOT EXISTS "navicomputer" TEXT,
  ADD COLUMN IF NOT EXISTS "sensor_range" TEXT,
  ADD COLUMN IF NOT EXISTS "ship_complement" TEXT,
  ADD COLUMN IF NOT EXISTS "encumbrance_capacity" TEXT,
  ADD COLUMN IF NOT EXISTS "passenger_capacity" TEXT,
  ADD COLUMN IF NOT EXISTS "consumables" TEXT,
  ADD COLUMN IF NOT EXISTS "price_credits" INTEGER,
  ADD COLUMN IF NOT EXISTS "rarity" INTEGER,
  ADD COLUMN IF NOT EXISTS "customization_hard_points" INTEGER,
  ADD COLUMN IF NOT EXISTS "weapons" TEXT,
  ADD COLUMN IF NOT EXISTS "source" TEXT;

COMMIT;
