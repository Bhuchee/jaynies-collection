import type { DeliveryZone } from "@/db/schema";
import { sendEmail } from "@/lib/mailgun";
import { formatOrderDate } from "@/lib/dates";
import { DELIVERY_ZONE_LABELS } from "@/lib/delivery";
import { formatNaira } from "@/lib/money";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, WHATSAPP_NUMBER, WHATSAPP_URL } from "@/lib/site";

/*
  FRD F9 and DESIGN.md section 8. A 600px table-based email with inline styles,
  always sent with a plain-text alternative.

  Email clients cannot read the CSS custom properties from globals.css, so the
  DESIGN.md section 2 tokens are repeated here as literal hex values. They are
  the only hex values outside globals.css and components.
*/
const PALETTE = {
  onyx: "#0A0A0A",
  inkMuted: "#5C5C5C",
  highlight: "#EAD86B",
  gold: "#C9A44C",
  mist: "#F1F2F1",
  photo: "#D3D3D3",
  line: "#E4E4E4",
  white: "#FFFFFF",
} as const;

const FONT_STACK = "Poppins, Arial, Helvetica, sans-serif";
const EMAIL_WIDTH = 600;
const THUMB_WIDTH = 64;
const THUMB_HEIGHT = 80;

export type OrderConfirmationItem = {
  name: string;
  size: string;
  quantity: number;
  lineTotalKobo: number;
  imageUrl: string | null;
};

/*
  FRD F7: the delivery fields are optional, so every one of them may be null.
  The Google name is carried separately as a greeting fallback, because the
  shopper may clear the name field.
*/
export type OrderConfirmationData = {
  orderNumber: string;
  recipientName: string | null;
  /** The session's Google name, used only when recipientName is empty. */
  fallbackName: string | null;
  recipientEmail: string;
  createdAt: Date;
  items: OrderConfirmationItem[];
  subtotalKobo: number;
  deliveryFeeKobo: number | null;
  totalKobo: number;
  deliveryZone: DeliveryZone;
  phone: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  note: string | null;
};

export type OrderConfirmationContent = {
  subject: string;
  html: string;
  text: string;
};

/** Rule 7: the absolute base URL always comes from the environment. */
export function getSiteUrl(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL;

  if (!value) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL is not set, so email links are unknown.",
    );
  }

  return value.replace(/\/+$/, "");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** FRD F7: the typed name first, then the Google name, then a neutral word. */
function firstNameOf(...candidates: (string | null | undefined)[]): string {
  for (const candidate of candidates) {
    const first = (candidate ?? "").trim().split(/\s+/)[0] ?? "";
    if (first) return first;
  }

  return "there";
}

/** Joins the address lines the shopper actually filled in, skipping blanks. */
function addressLines(data: OrderConfirmationData): string[] {
  return [
    data.recipientName,
    data.addressLine,
    [data.city, data.state].filter(Boolean).join(", "),
    data.country,
    data.phone,
  ].filter((line): line is string => !!line && line.trim() !== "");
}

function absoluteAsset(path: string, siteUrl: string): string {
  return path.startsWith("http") ? path : `${siteUrl}${path}`;
}

function itemRowHtml(item: OrderConfirmationItem, siteUrl: string): string {
  const thumbnail = item.imageUrl
    ? `<img src="${escapeHtml(absoluteAsset(item.imageUrl, siteUrl))}" alt="" width="${THUMB_WIDTH}" height="${THUMB_HEIGHT}" style="display:block;width:${THUMB_WIDTH}px;height:${THUMB_HEIGHT}px;object-fit:cover;border:1px solid ${PALETTE.line};border-radius:8px;" />`
    : `<span style="display:block;width:${THUMB_WIDTH}px;height:${THUMB_HEIGHT}px;background:${PALETTE.photo};border:1px solid ${PALETTE.line};border-radius:8px;"></span>`;

  return `
            <tr>
              <td style="padding:14px 0;border-bottom:1px solid ${PALETTE.line};">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td width="${THUMB_WIDTH}" style="width:${THUMB_WIDTH}px;vertical-align:top;">${thumbnail}</td>
                    <td style="padding-left:14px;vertical-align:top;">
                      <span style="display:block;font-size:15px;font-weight:500;color:${PALETTE.onyx};">${escapeHtml(item.name)}</span>
                      <span style="display:block;padding-top:2px;font-size:13px;color:${PALETTE.inkMuted};">Size ${escapeHtml(item.size)}</span>
                    </td>
                    <td style="padding-left:14px;vertical-align:top;font-size:15px;color:${PALETTE.onyx};">${item.quantity}</td>
                    <td style="padding-left:14px;vertical-align:top;font-size:15px;font-weight:600;color:${PALETTE.onyx};text-align:right;">${escapeHtml(formatNaira(item.lineTotalKobo))}</td>
                  </tr>
                </table>
              </td>
            </tr>`;
}

export function buildOrderConfirmation(
  data: OrderConfirmationData,
): OrderConfirmationContent {
  const siteUrl = getSiteUrl();
  const logoUrl = `${siteUrl}/brand/logo-dark-bg.png`;
  const orderUrl = `${siteUrl}/orders/${data.orderNumber}`;
  const greetingName = firstNameOf(data.recipientName, data.fallbackName);
  const greeting = escapeHtml(greetingName);
  const orderDate = formatOrderDate(data.createdAt);
  const isInternational = data.deliveryZone === "international";

  const subject = `Your Jaynie's Collection order ${data.orderNumber} is confirmed`;

  const rows = data.items.map((item) => itemRowHtml(item, siteUrl)).join("");

  const deliveryLine =
    data.deliveryFeeKobo === null
      ? "To be confirmed"
      : escapeHtml(formatNaira(data.deliveryFeeKobo));

  const internationalNote = isInternational
    ? "<br />Your shipping fee will be quoted then, before the order is confirmed."
    : "";

  const noteBlock = data.note
    ? `<tr><td style="padding:24px 32px 0 32px;"><p style="margin:0;font-size:13px;line-height:1.6;color:${PALETTE.inkMuted};"><strong style="color:${PALETTE.onyx};">Your note:</strong> ${escapeHtml(data.note)}</p></td></tr>`
    : "";

  /*
    FRD F7: the shopper may leave any of these blank, so blank lines are dropped
    instead of leaving empty lines or a stray comma in the address.
  */
  const addressBlock = addressLines(data)
    .map((line) => escapeHtml(line))
    .join("<br />");

  const addressText = addressLines(data);
  const noAddressGiven = addressText.length === 0;

  const textLines = [
    `Thank you, ${greetingName}`,
    "",
    `Your Jaynie's Collection order ${data.orderNumber} is confirmed.`,
    `Placed on ${orderDate}.`,
    "",
    "Items",
    ...data.items.map(
      (item) =>
        `  ${item.name} | Size ${item.size} | Qty ${item.quantity} | ${formatNaira(item.lineTotalKobo)}`,
    ),
    "",
    `Subtotal: ${formatNaira(data.subtotalKobo)}`,
    `Delivery (${DELIVERY_ZONE_LABELS[data.deliveryZone]}): ${data.deliveryFeeKobo === null ? "to be confirmed" : formatNaira(data.deliveryFeeKobo)}`,
    `Total: ${formatNaira(data.totalKobo)}`,
    "",
    "Delivery address",
    ...(noAddressGiven
      ? ["Not provided. Jaynie will contact you to arrange delivery."]
      : addressText),
    ...(data.note ? ["", `Your note: ${data.note}`] : []),
    "",
    "What happens next",
    "Jaynie will WhatsApp you within 24 hours to confirm payment and delivery.",
    ...(isInternational ? ["Your shipping fee will be quoted then."] : []),
    "",
    `View your order: ${orderUrl}`,
    "",
    `Instagram @${INSTAGRAM_HANDLE}: ${INSTAGRAM_URL}`,
    `WhatsApp: ${WHATSAPP_URL}`,
    "",
    "Jaynie's Collection",
  ];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${PALETTE.white};font-family:${FONT_STACK};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PALETTE.white};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${EMAIL_WIDTH}" style="width:${EMAIL_WIDTH}px;max-width:${EMAIL_WIDTH}px;background:${PALETTE.white};">

<tr><td style="background:${PALETTE.onyx};padding:28px 32px;">
<img src="${escapeHtml(logoUrl)}" alt="Jaynie's Collection" width="180" style="display:block;width:180px;max-width:180px;height:auto;border:0;outline:none;text-decoration:none;" />
</td></tr>

<tr><td style="background:${PALETTE.highlight};padding:12px 32px;font-size:12px;font-weight:600;letter-spacing:0.08em;color:${PALETTE.onyx};">
ORDER ${escapeHtml(data.orderNumber)}
</td></tr>

<tr><td style="padding:32px 32px 24px 32px;">
<h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:900;text-transform:uppercase;letter-spacing:-0.01em;color:${PALETTE.onyx};">Thank you, ${greeting}</h1>
<p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:${PALETTE.inkMuted};">Your order is confirmed. Here is everything you need.</p>
<p style="margin:4px 0 0;font-size:14px;line-height:1.6;color:${PALETTE.inkMuted};">Placed on ${escapeHtml(orderDate)}.</p>
</td></tr>

<tr><td style="padding:0 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<th align="left" style="padding:0 0 8px 0;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${PALETTE.inkMuted};">Item</th>
<th align="left" style="padding:0 0 8px 0;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${PALETTE.inkMuted};">Qty</th>
<th align="right" style="padding:0 0 8px 0;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${PALETTE.inkMuted};">Total</th>
</tr>${rows}
</table>
</td></tr>

<tr><td style="padding:20px 32px 0 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td style="font-size:14px;color:${PALETTE.inkMuted};">Subtotal</td><td align="right" style="font-size:14px;font-weight:500;color:${PALETTE.onyx};">${escapeHtml(formatNaira(data.subtotalKobo))}</td></tr>
<tr><td style="padding-top:6px;font-size:14px;color:${PALETTE.inkMuted};">Delivery (${escapeHtml(DELIVERY_ZONE_LABELS[data.deliveryZone])})</td><td align="right" style="padding-top:6px;font-size:14px;font-weight:500;color:${PALETTE.onyx};">${deliveryLine}</td></tr>
<tr><td style="padding-top:12px;border-top:1px solid ${PALETTE.line};font-size:16px;font-weight:600;color:${PALETTE.onyx};">Total</td><td align="right" style="padding-top:12px;border-top:1px solid ${PALETTE.line};font-size:16px;font-weight:600;color:${PALETTE.onyx};">${escapeHtml(formatNaira(data.totalKobo))}</td></tr>
</table>
</td></tr>

<tr><td style="padding:24px 32px 0 32px;">
<p style="margin:0;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${PALETTE.onyx};">Delivery address</p>
<p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:${PALETTE.onyx};">${noAddressGiven ? "Not provided. Jaynie will contact you to arrange delivery." : addressBlock}</p>
</td></tr>
${noteBlock}
<tr><td style="padding:24px 32px 0 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PALETTE.mist};border-radius:8px;">
<tr><td style="padding:20px;">
<p style="margin:0;font-size:14px;line-height:1.6;color:${PALETTE.onyx};"><strong>What happens next</strong></p>
<p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:${PALETTE.inkMuted};">Jaynie will WhatsApp you within 24 hours to confirm payment (transfer or pay on delivery) and the delivery date.${internationalNote}</p>
</td></tr>
</table>
</td></tr>

<tr><td align="center" style="padding:28px 32px 36px 32px;">
<a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:${PALETTE.gold};color:${PALETTE.onyx};font-size:15px;font-weight:600;line-height:1;padding:16px 28px;border-radius:4px;text-decoration:none;">View your order</a>
</td></tr>

<tr><td style="background:${PALETTE.onyx};padding:24px 32px;">
<p style="margin:0;font-size:14px;font-weight:600;color:${PALETTE.white};">Jaynie's Collection</p>
<p style="margin:8px 0 0;font-size:13px;line-height:1.8;color:${PALETTE.highlight};">
<a href="${escapeHtml(INSTAGRAM_URL)}" style="color:${PALETTE.highlight};text-decoration:underline;">Instagram @${escapeHtml(INSTAGRAM_HANDLE)}</a>
&nbsp;&nbsp;|&nbsp;&nbsp;
<a href="${escapeHtml(WHATSAPP_URL)}" style="color:${PALETTE.highlight};text-decoration:underline;">WhatsApp ${escapeHtml(WHATSAPP_NUMBER)}</a>
</p>
<p style="margin:12px 0 0;font-size:12px;color:${PALETTE.inkMuted};">Complete your style with pieces made by hand.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, html, text: textLines.join("\n") };
}

/*
  FRD F8 step 9. Builds the content and hands it to Mailgun. Returns a result
  object rather than throwing, so the caller decides what to do.
*/
export async function sendOrderConfirmation(
  data: OrderConfirmationData,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const content = buildOrderConfirmation(data);

  const result = await sendEmail({
    to: data.recipientEmail,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, id: result.id };
}