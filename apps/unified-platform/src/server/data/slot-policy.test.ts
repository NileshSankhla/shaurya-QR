import assert from "node:assert/strict";
import test from "node:test";
import { foodSlotAcceptsScans } from "./slot-policy";

const now = new Date("2026-10-05T10:00:00.000Z");
const past = new Date("2026-10-05T09:00:00.000Z");
const future = new Date("2026-10-05T11:00:00.000Z");

test("a manually active slot accepts scans before its scheduled start", () => {
  assert.equal(foodSlotAcceptsScans("ACTIVE", future, future, now), true);
});

test("a scheduled slot auto-opens only after its start time", () => {
  assert.equal(foodSlotAcceptsScans("SCHEDULED", past, future, now), true);
  assert.equal(foodSlotAcceptsScans("SCHEDULED", future, future, now), false);
});

test("paused and closed slots never accept scans", () => {
  assert.equal(foodSlotAcceptsScans("PAUSED", past, future, now), false);
  assert.equal(foodSlotAcceptsScans("CLOSED", past, future, now), false);
});

test("an ended slot never accepts scans", () => {
  assert.equal(foodSlotAcceptsScans("ACTIVE", past, past, now), false);
  assert.equal(foodSlotAcceptsScans("SCHEDULED", past, past, now), false);
});
