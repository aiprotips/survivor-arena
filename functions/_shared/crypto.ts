/// <reference types="@cloudflare/workers-types" />

const passwordHashAlgorithm = "pbkdf2-sha256";
const passwordHashIterations = 210000;
const passwordHashBits = 256;

const textEncoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string) {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) {
    return new Uint8Array();
  }

  const bytes = new Uint8Array(hex.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function constantTimeEqual(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;

  for (let index = 0; index < maxLength; index += 1) {
    difference |=
      (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return difference === 0;
}

async function derivePasswordHash(password: string, salt: Uint8Array, iterations: number) {
  const saltBuffer = salt.buffer.slice(
    salt.byteOffset,
    salt.byteOffset + salt.byteLength,
  ) as ArrayBuffer;
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      hash: "SHA-256",
      iterations,
      name: "PBKDF2",
      salt: saltBuffer,
    },
    key,
    passwordHashBits,
  );

  return bytesToHex(new Uint8Array(bits));
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt, passwordHashIterations);

  return [
    passwordHashAlgorithm,
    String(passwordHashIterations),
    bytesToHex(salt),
    hash,
  ].join("$");
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsValue, saltHex, expectedHash] = storedHash.split("$");
  const iterations = Number.parseInt(iterationsValue, 10);

  if (
    algorithm !== passwordHashAlgorithm ||
    !Number.isFinite(iterations) ||
    !saltHex ||
    !expectedHash
  ) {
    return false;
  }

  const actualHash = await derivePasswordHash(password, hexToBytes(saltHex), iterations);

  return constantTimeEqual(actualHash, expectedHash);
}

export function createRandomToken(byteLength = 32) {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(value));

  return bytesToHex(new Uint8Array(digest));
}
