/*
  Public contact details. NEXT_PUBLIC_SITE_URL is deliberately absent here:
  it is only ever read from the environment, never defaulted to localhost
  (AGENTS.md rule 7).
*/
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2348000000000";

export const INSTAGRAM_HANDLE =
  process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? "jayniescollection";

export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;