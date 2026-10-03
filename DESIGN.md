# DESIGN — Jaynie's Collection

The look comes from Brian's own hero design: bold uppercase headlines, yellow highlighter marks, soft grey product photography, a cream section background, and a black footer. The gold Jaynie logo is the brand mark. Keep it **simple, confident, and premium**: plenty of white space, few colours, and the clothes as the main focus.

The references were used as follows:
- **Brian's hero design:** the source of truth for colour use, type, and the hero.
- **Viva web shop:** layout structure only (trust band, category row, product rows, footer columns).
- **Burger app:** mobile patterns only (category chips, size selector pills, quantity stepper, sticky add-to-cart bar). None of its dark glass styling.

---

## 1. Hard rules

1. **No emoji anywhere**: not in the UI, emails, alt text, seed data, or commit messages.
2. **Icons:** `lucide-react` only, 1.5px stroke, 20px by default (24px in navigation). Instagram and WhatsApp brand marks are inline SVGs in `components/icons/`.
3. Use only the colour tokens below. Never hard-code a hex value in components.
4. Every product image sits on the same light grey background and uses a 3:4 aspect ratio.
5. Build mobile-first. Test at 360, 768, and 1280px.
6. Tap targets are at least 44px. Focus rings are visible: a 2px Onyx ring with a 2px offset.
7. Use "₦" with thousands separators, for example ₦47,000. Never show kobo.

## 2. Colour tokens

Define these as CSS variables in `globals.css` and map them in the Tailwind theme.

| Token | Hex | Use |
|---|---|---|
| `--onyx` | `#0A0A0A` | Primary text, primary buttons, footer, active chips |
| `--ink-muted` | `#5C5C5C` | Secondary text |
| `--highlight` | `#EAD86B` | Highlighter blocks behind headline words, the delivery band, badges, brush underlines (from Brian's design) |
| `--gold` | `#C9A44C` | Logo-adjacent accents, the email button, the cart badge |
| `--gold-deep` | `#8E6E27` | Gold text on light backgrounds (meets AA contrast) |
| `--cream` | `#FBF9EE` | Alternate section background ("Clothes For You") |
| `--mist` | `#F1F2F1` | Hero card background, input backgrounds |
| `--photo` | `#D3D3D3` | Product image placeholder and card background, matching the photo backdrop |
| `--line` | `#E4E4E4` | Borders and dividers |
| `--white` | `#FFFFFF` | Page background |
| `--success` | `#2F6B3B` | Success banner text and icon |
| `--danger` | `#B3261E` | Errors |

Use black text on `--highlight`. Never put white text on highlight or gold.

## 3. Typography

- **Font:** Poppins (via `next/font/google`) for everything. Weights: 400, 500, 600, 800, 900.
- **Display and section titles:** Poppins 900, UPPERCASE, letter-spacing −0.01em.
  - Hero: `clamp(2.5rem, 6vw, 4.5rem)`, line-height 1.05
  - Section titles: `clamp(1.5rem, 3vw, 2rem)`
- **Body:** 400 at 16px, line-height 1.6. Small text is 14px.
- **Product name:** 500, 16px. **Price:** 600, 16px. **Compare-at price:** 400, `--ink-muted`, strikethrough.
- **Buttons:** 600, 15px, sentence case.

## 4. Brand assets (`public/brand/`)

- `logo.png`: the gold "JAYNIE" logo on a transparent background. Used in the header at 36px high on mobile and 44px on desktop.
- `logo-dark-bg.png`: the gold logo on black. Used in the footer and the email header.
- `logo-email.png`: not used. The confirmation email header uses `logo-dark-bg.png`, which already exists and is the gold logo on black.
- **Motif:** the needle and thread. Use it as a thin `--gold` curved SVG line as an occasional divider. Use it sparingly, at most once per page.

## 5. Components

- **Button / primary:** `--onyx` background, white text, 4px radius, 48px high, 24px horizontal padding. On hover, use 85% opacity.
- **Button / secondary:** white background, 1px `--onyx` border, `--onyx` text.
- **Button / Google:** white, 1px `--line` border, inline Google "G" SVG, the text "Continue with Google".
- **Highlight word:** an inline `<span>` with a `--highlight` background, padding `0 .15em`, and `box-decoration-break: clone`.
- **Brush underline:** an SVG yellow swash under the second half of a section title, for example the "LING" in "BEST SELLING", as in Brian's design.
- **Product card:**
  - Image area: `--photo` background, 12px radius, 1px `--line` border, 3:4 ratio, `object-cover`.
  - Below the image: name, then the price row, with a `lucide ArrowRight` icon on the right.
  - On sets, a "Save ₦7,000" pill in `--highlight` sits in the top-left of the image.
  - On hover (desktop), the image scales to 1.03 over 300ms.
- **Placeholder image:** `--photo` background with a centred lucide `Shirt` icon (48px, `--ink-muted`) and the category name in small caps.
- **Category chip:** pill-shaped, 40px high, 1px `--line` border. When active, `--onyx` background with white text. On mobile, chips scroll horizontally.
- **Size selector:** three 48px square pills (S/M/L). Selected: `--onyx` fill. Unselected: border only.
- **Quantity stepper:** a `Minus` and `Plus` icon button around the number, 40px high.
- **Status badge:** pill, 12px, weight 600. Colours:

| Status | Background | Text |
|---|---|---|
| Placed | `--mist` | `--onyx` |
| Awaiting quote | `--highlight` | `--onyx` |
| Confirmed or Delivered | `--success` at 12% opacity | `--success` |
| Cancelled | `--danger` at 10% opacity | `--danger` |

- **Toast:** bottom-centre on mobile and bottom-right on desktop, `--onyx` background, white text, a `Check` icon, and a "View cart" link.
- **Inputs:** `--mist` background, 1px `--line` border, 8px radius, 48px high, label above. On error, the border uses `--danger` and a message appears below.

## 6. Page layouts

### Header
- White background, sticky, 1px bottom border in `--line`.
- Desktop: logo on the left; nav links (uppercase, 13px, weight 500, letter-spacing 0.06em) in the centre; a 280px search input (`--mist` background, `Search` icon); then the `Package` (My Orders), `User`, and `ShoppingBag` icons with a gold count badge.
- Mobile: logo on the left; `Search` and `ShoppingBag` icons on the right. The search icon opens a full-width input that slides down under the header.

### Hero (from Brian's design)
- A `--mist` card with a 24px radius, inset from the page edges.
- **Left side:**
  - Stacked headline "LET'S / ELEVATE / YOUR / FIT." with "LET'S" on a white block and "YOUR" on a `--highlight` block.
  - Subline: "Drip that speaks louder than trends."
  - Primary button "Shop Now", linking to `/shop`.
- **Right side:** two cut-out model images, `hero-man-ember.png` and `hero-woman-lilac.png`, side by side, bottom-aligned, overlapping by 1.5rem to 2.5rem. Both are sized by height so they render at the same height despite having different aspect ratios. The woman sits on the white plinth, as in the design. Cut-out files are trimmed to their alpha bounding box so the overlap and the shared baseline land on the figures rather than on transparent canvas.
- **Decoration:** 4–5 faint 4-point star or sparkle SVG shapes in `--line`.
- **Mobile:** the text comes first, then the models below at full width, and the headline stays at 4 lines.

### Delivery band
- Full width, `--highlight` background, 48px high. The text is centred at 14px weight 600 and uses a `Truck` icon.
- **Below `sm`:** a shortened line ("Abuja ₦5,000 · Nigeria ₦10,000 · International on request") centred at 13px, allowed to wrap to two lines. The strip grows past 48px rather than clipping, and hides horizontal overflow. No marquee.

### Best Selling
- White section. Centred title "BEST SELLING" with the brush underline and the subline "Get in on the trend with our curated selection of best-selling styles." Below it, a 3-column grid of product cards, which becomes a 2-column scroll row on mobile.

### Clothes For You
- `--cream` section, centred title with the brush underline, and a 4-column grid (2 columns on mobile).

### How ordering works
- Three columns, each with a lucide icon in a 56px `--highlight` circle: `Shirt` (Pick your fit), `ClipboardCheck` (Place your order), `Truck` (We confirm & deliver).

### Footer
- `--onyx` background. Left: `logo-dark-bg.png` and "Complete your style with pieces made by hand." Middle: links. Right: 36px social squares with a `--highlight` background and black icons (Instagram, WhatsApp). Bottom row: copyright line in `--ink-muted`.

### Product page
- Desktop: 2 columns, with the image on the left (sticky) and the details on the right.
- Mobile: the image takes the full width, followed by the details, and a sticky bottom bar (white, top border) holds the stepper and the "Add to cart · ₦total" button.

### Checkout
- Desktop: 2 columns, with the form on the left and the summary on the right (sticky).
- Mobile: the summary collapses into a "Show order summary" accordion at the top.
- Delivery zone options are large radio cards with a `MapPin` icon and the fee shown on the right.

### Mobile bottom nav (below 768px)
- White, top border, 4 items: `Home`, `LayoutGrid` (Shop), `Package` (Orders), `ShoppingBag` (Cart, with badge). Active items use `--onyx` with a 2px bar above; inactive items use `--ink-muted`.

## 7. Motion
- 150–300ms ease-out only. No parallax and no autoplaying carousels. Respect `prefers-reduced-motion`.

## 8. Email look
- 600px wide on a white background. Black header with the gold logo. A `--highlight` bar under the header with the order number. A Poppins → Arial fallback stack. Items in a table with 64px thumbnails. A gold (`--gold`) "View your order" button with black text. Black footer with the Instagram and WhatsApp links. No emoji.

## 9. Image assets

### Provided (crop out the Gemini sparkle watermark, export as WebP, 1200×1600)

| File | Source photo |
|---|---|
| shirt-mosaic.webp | Blue, gold, and green mosaic short-sleeve shirt |
| shirt-gold-lattice.webp | Gold, black, and white diagonal print shirt |
| shirt-ember-camp.webp | Orange, black, and white camp-collar shirt |
| shirt-rust.webp | Rust abstract short-sleeve shirt |
| set-ember-longsleeve.webp | Orange abstract long-sleeve shirt with grey trousers |
| set-burgundy.webp | Burgundy hoodie and joggers |
| set-olive.webp | Olive hoodie and joggers |
| set-ash.webp | Grey hoodie and joggers |
| set-monochrome.webp | Black and white colour-block hoodie and joggers |
| set-lilac-cream.webp | Lilac and cream hoodie set |
| set-sky-onyx.webp | Sky blue and black hoodie set |
| hero-woman-lilac.png | Model in the lilac set, on the plinth (transparent background) |
| hero-man-ember.png | Model in the orange camp-collar shirt (transparent background) |

### To generate (Gemini, same style as the existing photos)

**Base prompt:**
> Studio product photo of a [ITEM], [presentation], plain light grey seamless background (#D3D3D3), soft even lighting, centred, 3:4 portrait, a small cream hang tag reading "Jaynie's" attached, high detail fabric texture, no people, no text other than the tag.

| File | [ITEM] | [presentation] |
|---|---|---|
| hoodie-classic.webp | black heavyweight pullover hoodie with small gold "JAYNIE" embroidery on the chest | folded flat-lay, top-down |
| joggers-classic.webp | ash grey cuffed joggers with gold-tipped drawstrings | folded flat-lay, top-down |
| shorts-classic.webp | olive fleece shorts with gold-tipped drawstrings | flat-lay, top-down |
| cargo-utility.webp | khaki utility cargo pants with side pockets | flat-lay, top-down |
| tee-essential.webp | white crew-neck T-shirt with small gold "JAYNIE" chest print | on a white mannequin torso |
| polo-signature.webp | black piqué polo shirt with a gold embroidered logo | on a white mannequin torso |
| ankara-bubu.webp | flowing long Ankara bubu gown in orange, black, and gold wax print | on a white dress form |
| ankara-two-piece.webp | Ankara crop top and shorts set in an orange and gold print | on a white dress form |
| ankara-wrap-skirt.webp | Ankara midi wrap skirt in a black and gold print | on a white dress form |
| ankara-statement.webp | fitted Ankara mermaid gown with puff sleeves in a rust and gold print | on a white dress form |

After generating, update `image_url` in the seed and run `npm run db:seed` again.
