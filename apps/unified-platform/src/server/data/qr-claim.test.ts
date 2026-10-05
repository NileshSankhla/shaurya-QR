import assert from "node:assert/strict";
import test from "node:test";
import type { Prisma } from "@prisma/client";
import { claimQr } from "./qr-claim";

type FakeCard = {
  uid: string;
  status: string;
  guestId: string | null;
  guest: { name: string } | null;
};

function qrTransaction(initialCard: FakeCard | null = null) {
  let card = initialCard;
  const tx = {
    qrCard: {
      createMany: async (input: {
        data: Array<{ uid: string; status: string }>;
      }) => {
        if (card) return { count: 0 };
        const row = input.data[0];
        if (!row) return { count: 0 };
        card = { ...row, guestId: null, guest: null };
        return { count: 1 };
      },
      updateMany: async (input: {
        where: { uid: string; status: string; guestId: null };
        data: { status: string; guestId: string };
      }) => {
        if (
          !card ||
          card.uid !== input.where.uid ||
          card.status !== input.where.status ||
          card.guestId !== null
        ) {
          return { count: 0 };
        }
        card = { ...card, ...input.data };
        return { count: 1 };
      },
      findUnique: async () => card,
    },
  } as unknown as Prisma.TransactionClient;

  return { tx, card: () => card };
}

test("registers and claims a previously unseen valid QR UID", async () => {
  const fake = qrTransaction();

  await claimQr(fake.tx, "SHAURYA-0001", "guest-1");

  assert.deepEqual(fake.card(), {
    uid: "SHAURYA-0001",
    status: "ASSIGNED",
    guestId: "guest-1",
    guest: null,
  });
});

test("continues to claim a preloaded or reusable QR UID", async () => {
  const fake = qrTransaction({
    uid: "SHAURYA-0002",
    status: "AVAILABLE",
    guestId: null,
    guest: null,
  });

  await claimQr(fake.tx, "SHAURYA-0002", "guest-2");

  assert.equal(fake.card()?.guestId, "guest-2");
  assert.equal(fake.card()?.status, "ASSIGNED");
});

test("does not let a second participant claim an assigned QR UID", async () => {
  const fake = qrTransaction({
    uid: "SHAURYA-0003",
    status: "ASSIGNED",
    guestId: "guest-1",
    guest: { name: "Existing Participant" },
  });

  await assert.rejects(
    claimQr(fake.tx, "SHAURYA-0003", "guest-2"),
    /already assigned to Existing Participant/,
  );
  assert.equal(fake.card()?.guestId, "guest-1");
});
