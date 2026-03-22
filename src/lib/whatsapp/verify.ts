import crypto from "crypto";

export function verifyWebhook(searchParams: URLSearchParams): string | null {
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN &&
    challenge
  ) {
    return challenge;
  }

  return null;
}

export function verifySignature(rawBody: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.WHATSAPP_APP_SECRET!)
    .update(rawBody)
    .digest("hex");

  const providedSignature = signature.replace("sha256=", "");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(providedSignature, "hex")
  );
}
