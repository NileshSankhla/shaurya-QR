CREATE INDEX IF NOT EXISTS "users_active_college_idx"
  ON "users" ("active", "college");

CREATE INDEX IF NOT EXISTS "volunteers_active_idx"
  ON "volunteers" ("active");

CREATE INDEX IF NOT EXISTS "food_slots_status_updated_at_idx"
  ON "food_slots" ("status", "updated_at" DESC);

CREATE INDEX IF NOT EXISTS "food_slots_start_time_idx"
  ON "food_slots" ("start_time");

CREATE INDEX IF NOT EXISTS "food_entries_scanned_at_idx"
  ON "food_entries" ("scanned_at" DESC);

CREATE INDEX IF NOT EXISTS "scan_events_volunteer_id_successful_idx"
  ON "scan_events" ("volunteer_id", "successful");

CREATE INDEX IF NOT EXISTS "scan_events_created_at_idx"
  ON "scan_events" ("created_at" DESC);