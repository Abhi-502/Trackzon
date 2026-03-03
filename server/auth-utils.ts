import crypto from "node:crypto";

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${ITERATIONS}:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [iterationsRaw, salt, expected] = storedHash.split(":");
  const iterations = Number(iterationsRaw);
  if (!iterations || !salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(actual, "hex"));
}
