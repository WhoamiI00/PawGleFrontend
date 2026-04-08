import { NextResponse } from "next/server";

export const runtime = "edge";

// Decode a base64 string to a Uint8Array (edge-compatible, no Buffer)
function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Constant-time string comparison to avoid timing attacks
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Verify a Svix-format webhook signature (Resend uses Svix under the hood).
// Spec: https://docs.svix.com/receiving/verifying-payloads/how-manual
async function verifySvixSignature(headers, rawBody, secret) {
  const svixId = headers.get("svix-id") || headers.get("webhook-id");
  const svixTimestamp =
    headers.get("svix-timestamp") || headers.get("webhook-timestamp");
  const svixSignature =
    headers.get("svix-signature") || headers.get("webhook-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("Missing Svix headers", {
      svixId: !!svixId,
      svixTimestamp: !!svixTimestamp,
      svixSignature: !!svixSignature,
    });
    return false;
  }

  // Strip the "whsec_" prefix and base64-decode the remainder to get raw HMAC key bytes.
  const secretKey = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const keyBytes = base64ToBytes(secretKey);

  // Svix signs the content: "{svix_id}.{svix_timestamp}.{body}"
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(signedContent)
  );
  const expectedSignature = btoa(
    String.fromCharCode(...new Uint8Array(sigBuffer))
  );

  // Header format: "v1,<base64sig> v1,<base64sig2> ..." (space-separated).
  // Verification passes if ANY v1 signature matches.
  const signatures = svixSignature.split(" ");
  for (const sig of signatures) {
    const [version, value] = sig.split(",");
    if (
      version === "v1" &&
      value &&
      timingSafeEqual(value, expectedSignature)
    ) {
      return true;
    }
  }
  return false;
}

// POST /api/resend/inbound — handles incoming email webhooks from Resend
export async function POST(request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("RESEND_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { success: false, error: "Server misconfigured" },
      { status: 500 }
    );
  }

  // Read raw body for signature verification
  const rawBody = await request.text();

  // Verify webhook signature
  try {
    const isValid = await verifySvixSignature(request.headers, rawBody, secret);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      );
    }
  } catch (err) {
    console.error("Signature verification error:", err);
    return NextResponse.json(
      { success: false, error: "Signature verification failed" },
      { status: 401 }
    );
  }

  // Parse JSON safely
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  // Extract email fields
  const { from, to, subject, text, html } = body.data ?? {};

  console.log("--- Resend Inbound Email ---");
  console.log("From:", from);
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Text:", text?.slice(0, 500));
  console.log("HTML:", html ? `${html.length} chars` : "none");
  console.log("Full payload:", JSON.stringify(body, null, 2));

  // Forward the parsed reply to the Django backend for dispatch to the other party
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_PORT || "";
  const forwardSecret = process.env.FORWARD_REPLY_SECRET;

  try {
    const res = await fetch(`${backendUrl}/api/auth/email/forward-reply/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forward-Secret": forwardSecret,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html,
        attachments: body.data?.attachments ?? [],
      }),
    });
    if (!res.ok) {
      console.error("Backend forward failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("Backend forward error:", err);
  }

  // Always return 200 so Resend doesn't retry endlessly
  return NextResponse.json({ success: true });
}
