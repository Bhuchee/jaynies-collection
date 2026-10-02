/*
  FRD F9. Mailgun over the HTTP API with fetch, no SDK.

  sendEmail never throws: it returns a result object so a mail failure can
  never take down the order that triggered it (AGENTS.md rule 8).
*/

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  bcc?: string | string[];
};

export type SendEmailResult =
  | { ok: true; id: string; message: string }
  | { ok: false; status: number; error: string };

const DEFAULT_API_BASE = "https://api.mailgun.net";

function toList(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAIL_FROM;
  const apiBase = trimTrailingSlash(
    process.env.MAILGUN_API_BASE ?? DEFAULT_API_BASE,
  );

  if (!apiKey || !domain) {
    return {
      ok: false,
      status: 0,
      error: "MAILGUN_API_KEY or MAILGUN_DOMAIN is not set.",
    };
  }

  if (!from) {
    return { ok: false, status: 0, error: "MAIL_FROM is not set." };
  }

  const body = new URLSearchParams();
  body.set("from", from);
  for (const address of toList(input.to)) body.append("to", address);
  if (input.bcc) {
    for (const address of toList(input.bcc)) body.append("bcc", address);
  }
  body.set("subject", input.subject);
  body.set("html", input.html);
  body.set("text", input.text);

  try {
    const response = await fetch(
      `${apiBase}/v3/${domain}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        cache: "no-store",
      },
    );

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const detail =
        payload && typeof payload === "object" && "message" in payload
          ? String((payload as { message: unknown }).message)
          : `Mailgun responded with ${response.status}.`;

      return { ok: false, status: response.status, error: detail };
    }

    const id =
      payload && typeof payload === "object" && "id" in payload
        ? String((payload as { id: unknown }).id)
        : "";

    return { ok: true, id, message: "Queued for delivery." };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : "Unknown Mailgun error.",
    };
  }
}