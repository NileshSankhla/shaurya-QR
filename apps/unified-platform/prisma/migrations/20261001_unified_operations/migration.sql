CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "college" TEXT NOT NULL,
  "mobile" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'UNASSIGNED',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "volunteers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'VOLUNTEER',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "qr_codes" (
  "unique_token" TEXT PRIMARY KEY,
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
  "assigned_user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "action" TEXT NOT NULL,
  "volunteer_name" TEXT NOT NULL,
  "user_name" TEXT,
  "user_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "qr_token" TEXT,
  "details" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "removed_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "users_name_idx" ON "users" ("name");
CREATE INDEX IF NOT EXISTS "users_college_idx" ON "users" ("college");
CREATE INDEX IF NOT EXISTS "users_active_status_idx" ON "users" ("active", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "qr_codes_assigned_user_id_key"
  ON "qr_codes" ("assigned_user_id") WHERE "assigned_user_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "qr_codes_status_idx" ON "qr_codes" ("status");
CREATE INDEX IF NOT EXISTS "volunteers_role_active_idx" ON "volunteers" ("role", "active");
CREATE INDEX IF NOT EXISTS "activity_logs_action_idx" ON "activity_logs" ("action");

CREATE TABLE IF NOT EXISTS "food_days" (
  "id" SERIAL PRIMARY KEY,
  "label" TEXT NOT NULL,
  "event_date" DATE NOT NULL UNIQUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "food_slots" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "start_time" TIMESTAMPTZ NOT NULL,
  "end_time" TIMESTAMPTZ NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "day_id" INTEGER NOT NULL REFERENCES "food_days"("id") ON DELETE CASCADE,
  CONSTRAINT "food_slots_time_check" CHECK ("end_time" > "start_time"),
  CONSTRAINT "food_slots_status_check" CHECK ("status" IN ('SCHEDULED', 'ACTIVE', 'PAUSED', 'CLOSED'))
);

CREATE INDEX IF NOT EXISTS "food_slots_status_idx" ON "food_slots" ("status");
CREATE INDEX IF NOT EXISTS "food_slots_day_id_start_time_idx" ON "food_slots" ("day_id", "start_time");

CREATE TABLE IF NOT EXISTS "food_entries" (
  "id" SERIAL PRIMARY KEY,
  "scanned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "guest_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "slot_id" INTEGER NOT NULL REFERENCES "food_slots"("id") ON DELETE RESTRICT,
  "volunteer_id" UUID NOT NULL REFERENCES "volunteers"("id") ON DELETE RESTRICT,
  CONSTRAINT "food_entries_guest_id_slot_id_key" UNIQUE ("guest_id", "slot_id")
);

CREATE INDEX IF NOT EXISTS "food_entries_volunteer_id_scanned_at_idx" ON "food_entries" ("volunteer_id", "scanned_at");
CREATE INDEX IF NOT EXISTS "food_entries_slot_id_scanned_at_idx" ON "food_entries" ("slot_id", "scanned_at");

CREATE TABLE IF NOT EXISTS "scan_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "successful" BOOLEAN NOT NULL,
  "reason" TEXT,
  "qr_token" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "volunteer_id" UUID NOT NULL REFERENCES "volunteers"("id") ON DELETE RESTRICT,
  "guest_id" UUID REFERENCES "users"("id") ON DELETE SET NULL,
  "slot_id" INTEGER REFERENCES "food_slots"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "scan_events_volunteer_id_created_at_idx" ON "scan_events" ("volunteer_id", "created_at");
CREATE INDEX IF NOT EXISTS "scan_events_successful_created_at_idx" ON "scan_events" ("successful", "created_at");
