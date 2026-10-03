import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";
import { z as schema } from "zod";

/*
  FRD F7 and F8. One Zod schema is shared by the checkout form and the
  placeOrder Server Action, so the client and the server agree on every rule.
  The server re-runs this on its own input; the browser copy is never trusted.

  FRD F7: every delivery text field is OPTIONAL. There are no minimum lengths,
  no phone format rule, and no rule that ties a field to the delivery zone. The
  only rule left is the 300-character server-side maximum, applied here so the
  browser and the action enforce exactly the same limit.
*/

/** FRD F7. The one surviving validation rule on the delivery text fields. */
export const MAX_FIELD_LENGTH = 300;

/** A trimmed, optional free-text field. Empty is valid; only length is checked. */
const optionalText = (label: string) =>
  schema
    .string()
    .trim()
    .max(MAX_FIELD_LENGTH, `${label} must be ${MAX_FIELD_LENGTH} characters or fewer.`);

export const DELIVERY_ZONES = ["abuja", "nigeria", "international"] as const;
export type DeliveryZoneInput = (typeof DELIVERY_ZONES)[number];

/** FRD F4 and F8. Must stay in step with MAX_QUANTITY in store/cart.ts. */
export const MIN_LINE_QUANTITY = 1;
export const MAX_LINE_QUANTITY = 10;

export const checkoutSchema = schema.object({
  fullName: optionalText("Full name"),
  phone: optionalText("Phone"),
  /* Still required: the zone decides the delivery fee, and Abuja is
     preselected so a shopper can submit the form without touching it. */
  deliveryZone: schema.enum(DELIVERY_ZONES, {
    message: "Choose a delivery zone.",
  }),
  addressLine: optionalText("Address"),
  city: optionalText("City"),
  state: optionalText("State or region"),
  country: optionalText("Country"),
  note: optionalText("Order note").default(""),
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