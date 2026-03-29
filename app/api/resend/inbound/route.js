import { NextResponse } from "next/server";

export const runtime = "edge";

// Verify Resend webhook signature using Web Crypto API (edge-compatible)
async function verifySignature(payload, signature, secret) {
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  return signature === expectedSignature;
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
  const signature = request.headers.get("resend-signature");
  try {
    const isValid = await verifySignature(rawBody, signature, secret);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      );
    }
  } catch {
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

  return NextResponse.json({ success: true });
}
