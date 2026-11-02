import { env } from "void/env";

const CLUB_COPY = "long_chan05@yahoo.com.hk";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[2-9]\d{7}$/;

export type EnquiryField = "name" | "email" | "phone" | "message";

export type EnquiryResult =
  | { ok: true }
  | { ok: false; message: string; field?: EnquiryField };

type Enquiry = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

const TURNSTILE_ACTION = "contact";

type SiteverifyResult = {
  success?: boolean;
  action?: string;
  hostname?: string;
};

export async function deliverEnquiry(input: unknown, clientIp: string): Promise<EnquiryResult> {
  const verified = await verifyTurnstile(input, clientIp);
  if (!verified.ok) return verified;
  if (isBot(input)) return { ok: true };
  const parsed = parseEnquiry(input);
  if (!parsed.ok) return parsed;

  const idempotencyKey = crypto.randomUUID();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(resendPayload(parsed.value)),
  });
  if (!response.ok) return { ok: false, message: "發送訊息時出現錯誤，請稍後再試。" };
  return { ok: true };
}

function parseEnquiry(input: unknown): { ok: true; value: Enquiry } | Extract<EnquiryResult, { ok: false }> {
  const record = isRecord(input) ? input : {};
  const name = text(record.name);
  const email = text(record.email);
  const phone = text(record.phone);
  const message = text(record.message);

  if (!name) return { ok: false, field: "name", message: "請輸入您的姓名" };
  if (name.length > 80) return { ok: false, field: "name", message: "姓名太長" };
  if (!email) return { ok: false, field: "email", message: "請輸入您的電子郵件" };
  if (!EMAIL.test(email) || email.length > 254) {
    return { ok: false, field: "email", message: "請輸入有效的電子郵件地址" };
  }
  if (!phone) return { ok: false, field: "phone", message: "請輸入您的電話號碼" };
  if (!PHONE.test(phone)) return { ok: false, field: "phone", message: "請輸入有效的香港電話號碼" };
  if (!message) return { ok: false, field: "message", message: "請輸入您的訊息內容" };
  if (message.length > 2000) return { ok: false, field: "message", message: "訊息內容太長" };
  return { ok: true, value: { name, email, phone, message } };
}

function resendPayload(enquiry: Enquiry) {
  const submitted = new Intl.DateTimeFormat("zh-HK", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
  const bcc = uniqueAddresses(
    [env.CONTACT_EMAIL_BCC, CLUB_COPY].filter(
      (address) => address.toLowerCase() !== enquiry.email.toLowerCase(),
    ),
  );
  return {
    from: `屯門前鋒會及幼鋒會 <${env.CONTACT_EMAIL_FROM}>`,
    to: [enquiry.email],
    bcc,
    reply_to: env.CONTACT_EMAIL_BCC,
    subject: `感謝您對屯門前鋒會及幼鋒會的查詢 - ${singleLine(enquiry.name)}`,
    text: [
      `${enquiry.name}，我們已收到您的查詢，並會盡快回覆。`,
      "",
      `提交日期：${submitted}`,
      `電話：${enquiry.phone}`,
      `電郵：${enquiry.email}`,
      "",
      enquiry.message,
      "",
      "我們會在 1-2 個工作天內回覆。如有緊急問題，請直接致電我們。",
      "屯門山景邨景榮樓21-30號地下",
      "山景綜合青少年服務中心",
    ].join("\n"),
    html: enquiryHtml(enquiry, submitted),
  };
}

function enquiryHtml(enquiry: Enquiry, submitted: string) {
  const name = escapeHtml(enquiry.name);
  const phone = escapeHtml(enquiry.phone);
  const email = escapeHtml(enquiry.email);
  const message = escapeHtml(enquiry.message).replaceAll("\n", "<br />");
  return `<!doctype html>
<html lang="zh-Hant">
  <body style="margin:0;background:#f0f4f1;font-family:sans-serif;">
    <div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #e0e8e2;border-radius:16px;padding:28px;">
      <h1 style="margin:16px 0;color:#2c5e43;font-size:26px;">感謝您的查詢 - ${name}</h1>
      <p style="color:#5a6b5e;font-size:16px;">我們已收到您的查詢，並會盡快回覆。</p>
      <p style="color:#5a6b5e;font-size:16px;">以下是您的查詢摘要：</p>
      <div style="background:#e8f2ec;border-left:4px solid #7ab893;border-radius:16px;padding:20px;">
        <p style="margin:0;color:#4a5c50;font-size:14px;"><strong>提交日期：</strong>${escapeHtml(submitted)}</p>
        <p style="margin:8px 0 0;color:#4a5c50;font-size:14px;"><strong>電話：</strong>${phone}</p>
        <p style="margin:8px 0 0;color:#4a5c50;font-size:14px;"><strong>電郵：</strong>${email}</p>
        <p style="margin:8px 0 0;color:#4a5c50;font-size:14px;"><strong>您的查詢：</strong></p>
        <p style="margin:8px 0 0;background:#fff;border:1px solid #d5e2d8;border-radius:8px;padding:12px;color:#4a5c50;font-size:14px;">${message}</p>
      </div>
      <p style="color:#5a6b5e;font-size:16px;">我們正在審閱您的查詢，並會在 1-2 個工作天內回覆。如有任何緊急問題，請直接聯絡我們。</p>
      <p style="margin:32px 0 0;background:#f5f8f6;border-radius:16px;padding:20px;color:#7d8c82;font-size:12px;text-align:center;">
        © ${new Date().getFullYear()} 屯門前鋒會及幼鋒會. 保留所有權利。<br />
        屯門山景邨景榮樓21-30號地下<br />
        山景綜合青少年服務中心
      </p>
    </div>
  </body>
</html>`;
}

async function verifyTurnstile(input: unknown, clientIp: string): Promise<EnquiryResult> {
  const token = isRecord(input) ? input["cf-turnstile-response"] : undefined;
  const expectedHostnames = new Set(
    env.TURNSTILE_HOSTNAMES.split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );
  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > 2048 ||
    expectedHostnames.size === 0
  ) {
    return { ok: false, message: "無法完成驗證，請再試一次。" };
  }

  let result: SiteverifyResult;
  try {
    const body = new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: token,
    });
    if (clientIp) body.set("remoteip", clientIp);
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body,
    });
    if (!response.ok) throw new Error(`siteverify ${response.status}`);
    result = (await response.json()) as SiteverifyResult;
  } catch {
    return { ok: false, message: "無法完成驗證，請再試一次。" };
  }
  if (
    result.success !== true ||
    result.action !== TURNSTILE_ACTION ||
    typeof result.hostname !== "string" ||
    !expectedHostnames.has(result.hostname)
  ) {
    return { ok: false, message: "無法完成驗證，請再試一次。" };
  }
  return { ok: true };
}

function isBot(input: unknown) {
  return isRecord(input) && text(input.website).length > 0;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function singleLine(value: string) {
  return value.replace(/[\r\n\t]+/g, " ");
}

function uniqueAddresses(addresses: string[]) {
  const seen = new Set<string>();
  return addresses.filter((address) => {
    const key = address.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
