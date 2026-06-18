-- Add a bartender-controlled display order for customer-facing event menus.
ALTER TABLE "event_drinks" ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing menus with a stable order based on when drinks were added.
WITH ordered_event_drinks AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY "eventId" ORDER BY "createdAt" ASC, id ASC) - 1 AS display_order
  FROM "event_drinks"
)
UPDATE "event_drinks"
SET "displayOrder" = ordered_event_drinks.display_order
FROM ordered_event_drinks
WHERE "event_drinks".id = ordered_event_drinks.id;
