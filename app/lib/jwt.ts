import { SignJWT, jwtVerify } from "jose";

// TextEncoder don't understand strings, they only translates insto Uint8Array.
const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET);

export async function signJWT(
  payload: { sub: string; role: string },
  expiresIn: string = "24h",
) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { sub: string; role: string };
  } catch (err) {
    return null;
  }
}
