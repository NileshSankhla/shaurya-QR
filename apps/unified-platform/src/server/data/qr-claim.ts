import type { Prisma } from "@prisma/client";

export async function claimQr(
  tx: Prisma.TransactionClient,
  token: string,
  guestId: string,
) {
  // Register valid QR tokens on first use. createMany + skipDuplicates keeps
  // this compatible with preloaded/reusable cards and avoids a unique-key
  // failure when two operators scan the same new token concurrently.
  await tx.qrCard.createMany({
    data: [{ uid: token, status: "AVAILABLE" }],
    skipDuplicates: true,
  });

  const claimed = await tx.qrCard.updateMany({
    where: { uid: token, status: "AVAILABLE", guestId: null },
    data: { status: "ASSIGNED", guestId },
  });
  if (claimed.count === 1) return;

  const card = await tx.qrCard.findUnique({
    where: { uid: token },
    include: { guest: { select: { name: true } } },
  });
  if (card?.guestId || card?.status === "ASSIGNED") {
    const owner = card.guest?.name ? ` to ${card.guest.name}` : "";
    throw new Error(`QR code ${token} is already assigned${owner}`);
  }
  if (card && card.status !== "AVAILABLE")
    throw new Error(`QR code ${token} is not available`);
  throw new Error(
    "That QR was assigned by another operator. Scan a different QR.",
  );
}
