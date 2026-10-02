import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";
import { z as schema } from "zod";

/*
  FRD F7 and F8. One Zod schema is shared by the checkout form and the
  placeOrder Server Action, so the client and the server agree on every rule.
  The server re-runs this on its own input; the browser copy is never trusted.
*/

export const DELIVERY_ZONES = ["abuja", "nigeria", "international"] as const;
export type DeliveryZoneInput = (typeof DELIVERY_ZONES)[number];

/** FRD F4 and F8. Must stay in step with MAX_QUANTITY in store/cart.ts. */
export const MIN_LINE_QUANTITY = 1;
export const MAX_LINE_QUANTITY = 10;

export const checkoutSchema = schema
  .object({
    fullName: schema
      .string()
      .trim()
      .min(2, "Enter your full name.")
      .max(80, "That name is too long."),
    phone: schema
      .string()
      .trim()
      .regex(
        /^\+?[0-9]{7,20}$/,
        "Use digits only, 7 to 20 characters, with an optional + at the start.",
      ),
    deliveryZone: schema.enum(DELIVERY_ZONES, {
      message: "Choose a delivery zone.",
    }),
    addressLine: schema
      .string()
      .trim()
      .min(5, "Enter your street address.")
      .max(200, "That address is too long."),
    city: schema
      .string()
      .trim()
      .min(1, "Enter your city.")
      .max(80, "That city name is too long."),
    state: schema
      .string()
      .trim()
      .min(1, "Enter your state or region.")
      .max(80, "That name is too long."),
    country: schema
      .string()
      .trim()
      .min(2, "Enter your country.")
      .max(80, "That country name is too long."),
    note: schema
      .string()
      .trim()
      .max(300, "Keep the note under 300 characters.")
      .optional(),
  })
  .superRefine((value, ctx) => {
    const country = value.country.trim().toLowerCase();

    if (value.deliveryZone === "international") {
      if (country === "nigeria") {
        ctx.addIssue({
          code: "custom",
          path: ["country"],
          message: "Choose a Nigerian delivery zone, or change the country.",
        });
      }
      return;
    }

    if (country !== "nigeria") {
      ctx.addIssue({
        code: "custom",
        path: ["country"],
        message: "Nigeria is locked for this delivery zone.",
      });
    }
  });

export const cartLineSchema = schema.object({
  productId: schema.uuid("That product reference is not valid."),
  size: schema.string().trim().min(1, "Choose a size."),
  quantity: schema.coerce
    .number()
    .int("Choose a whole number of pieces.")
    .min(MIN_LINE_QUANTITY, "Choose at least one.")
    .max(MAX_LINE_QUANTITY, "Ten is the maximum per piece."),
});

export const placeOrderSchema = schema.object({
  lines: schema
    .array(cartLineSchema)
    .min(1, "Your cart is empty.")
    .max(50, "That cart is too large."),
  delivery: checkoutSchema,
});

export type CheckoutInput = schema.infer<typeof checkoutSchema>;
export type CartLineInput = schema.infer<typeof cartLineSchema>;
export type PlaceOrderInput = schema.infer<typeof placeOrderSchema>;

/** Flattens Zod issues into the per-field map react-hook-form expects. */
export function fieldErrorsFromIssues(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, { type: string; message: string }> {
  const errors: Record<string, { type: string; message: string }> = {};

  for (const issue of issues) {
    const key = issue.path.join(".") || "form";
    if (!errors[key]) {
      errors[key] = { type: "validation", message: issue.message };
    }
  }

  return errors;
}

/*
  react-hook-form needs a resolver. @hookform/resolvers is not on the locked
  stack, so this small adapter wraps the same Zod schema instead.
*/
export function zodResolver<T extends FieldValues>(
  zodSchema: z.ZodType<T>,
): Resolver<T> {
  return async (values) => {
    const result = zodSchema.safeParse(values);

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    return {
      values: {},
      errors: fieldErrorsFromIssues(result.error.issues) as FieldErrors<T>,
    };
  };
}