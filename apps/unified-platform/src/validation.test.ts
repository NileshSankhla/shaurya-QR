import assert from "node:assert/strict";
import test from "node:test";
import { validateQrToken, ValidationError } from "./lib/validation";

test("normalizes a valid QR UID before it reaches storage", () => {
  assert.equal(validateQrToken("  shaurya-0001  "), "SHAURYA-0001");
});

test("rejects malformed QR values before they reach storage", () => {
  for (const value of ["SHORT", "HAS SPACES", "NOT_VALID!", "A".repeat(81)]) {
    assert.throws(() => validateQrToken(value), ValidationError);
  }
});
