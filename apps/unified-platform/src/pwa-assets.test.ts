import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(appRoot, "public");

async function pngDimensions(relativePath: string) {
  const bytes = await readFile(path.join(publicRoot, relativePath));
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test("the web app manifest has installable, correctly-sized icons", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(publicRoot, "manifest.webmanifest"), "utf8"),
  ) as {
    name?: string;
    start_url?: string;
    scope?: string;
    display?: string;
    icons?: Array<{ src: string; sizes: string; purpose?: string }>;
  };

  assert.equal(manifest.name, "Shaurya Operations");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");

  const requiredIcons = [
    { src: "/icons/icon-192.png", size: 192, purpose: "any" },
    { src: "/icons/icon-512.png", size: 512, purpose: "any" },
    { src: "/icons/maskable-512.png", size: 512, purpose: "maskable" },
  ];

  for (const required of requiredIcons) {
    const icon = manifest.icons?.find((candidate) => candidate.src === required.src);
    assert.ok(icon, `Missing ${required.src}`);
    assert.equal(icon.sizes, `${required.size}x${required.size}`);
    assert.equal(icon.purpose, required.purpose);
    assert.deepEqual(await pngDimensions(required.src.slice(1)), {
      width: required.size,
      height: required.size,
    });
  }
});

test("the service worker keeps protected application pages network-only", async () => {
  const source = await readFile(path.join(publicRoot, "sw.js"), "utf8");
  assert.match(source, /request\.mode === "navigate"/);
  assert.match(source, /fetch\(request\)\.catch\(\(\) => caches\.match\(OFFLINE_URL\)\)/);
  assert.doesNotMatch(source, /PRECACHE[\s\S]*["']\/(admin|volunteer)/);
  const navigationBranch = source.slice(source.indexOf('request.mode === "navigate"'), source.indexOf('request.mode === "navigate"') + 240);
  assert.doesNotMatch(navigationBranch, /cache\.put/);
});
