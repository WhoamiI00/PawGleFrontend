import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Verify Resend webhook signature using HMAC SHA256
async function verifySignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Resend inbound email webhook payload
interface ResendEmailHeader {
  name: string;
  value: string;
}

interface ResendEmailPayload {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  created_at: string;
  headers: ResendEmailHeader[];
  reply_to?: string;
  cc?: string;
  bcc?: string;
  message_id?: string;
  spam_score?: number;
}

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: ResendEmailPayload;
}

// POST /api/resend/inbound — handles incoming email webhooks from Resend
export async function POST(request: NextRequest) {
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
  let body: ResendWebhookEvent;
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
