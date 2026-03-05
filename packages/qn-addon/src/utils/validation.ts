/**
 * Decode a base64 string, returning null on failure.
 */
export function decodeBase64(input: string): Buffer | null {
  try {
    const buf = Buffer.from(input, "base64");
    if (buf.toString("base64") !== input) {
      return null;
    }
    return buf;
  } catch {
    return null;
  }
}

/**
 * Decode a base64 string and verify it has the expected byte length.
 */
export function decodeBase64Exact(
  input: string,
  expectedLength: number,
): Buffer | null {
  const buf = decodeBase64(input);
  if (!buf || buf.length !== expectedLength) {
    return null;
  }
  return buf;
}
