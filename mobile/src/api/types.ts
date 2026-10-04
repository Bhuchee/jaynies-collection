/*
  FRD F14. The app's copy of the API contract, mirroring what the server sends.

  These are hand-written rather than imported from the website, because the app
  and the website are two separate build systems and importing across them is
  worse coupling than a small file. The contract itself is pinned by the FRD and
  was checked endpoint by endpoint in L3-1.

  Money is ALWAYS integer kobo here, never a formatted string (AGENTS.md rule 14).
*/

export type SavedCartLine = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  size: string;
  /** Kobo. Display-only: the server recalculates every price. */
  unitPriceKobo: number;
  quantity: number;
};

export type ProductDto = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  gender: string;
  priceKobo: number;
  compareAtKobo: number | null;
  imageUrl: string | null;
  sizes: string[];
  isBestSeller: boolean;
  categoryLabel: string;
  genderLabel: string;
};

export type OrderSummaryDto = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  totalKobo: number;
  itemCount: number;
  firstImageUrl: string | null;
};

export type OrderDetailDto = {
  order: {
    orderNumber: string;
    status: string;
    createdAt: string;
    deliveryZone: string;
    subtotalKobo: number;
    deliveryFeeKobo: number | null;
    totalKobo: number;
    recipientName: string | null;
    phone: string | null;
    addressLine: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    note: string | null;
    emailSentAt: string | null;
  };
  items: {
    productId: string;
    productName: string;
    imageUrl: string | null;
    size: string;
    unitPriceKobo: number;
    quantity: number;
    lineTotalKobo: number;
  }[];
};