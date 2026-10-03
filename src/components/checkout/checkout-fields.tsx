"use client";

import { MapPin } from "lucide-react";
import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { DELIVERY_FEES_KOBO, DELIVERY_ZONE_LABELS } from "@/lib/delivery";
import { formatNaira } from "@/lib/money";
import type { CheckoutInput, DeliveryZoneInput } from "@/lib/validation";

type CheckoutFieldsProps = {
  form: UseFormReturn<CheckoutInput>;
  zone: DeliveryZoneInput;
  busy: boolean;
  serverError: string | null;
  defaultEmail: string;
  onSubmit: (delivery: CheckoutInput) => Promise<void>;
};

const ZONES: DeliveryZoneInput[] = ["abuja", "nigeria", "international"];

const FIELD_CLASS =
  "h-12 w-full rounded-lg border bg-mist px-4 text-base text-onyx placeholder:text-ink-muted";

function fieldClass(error?: string, extra?: string): string {
  return `mt-2 ${FIELD_CLASS} ${error ? "border-danger" : "border-line"}${
    extra ? ` ${extra}` : ""
  }`;
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-onyx">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-2 text-sm text-ink-muted">{hint}</p> : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}

/*
  FRD F7. Every delivery field is optional, so nothing here is read-only, nothing
  is marked required, and the only inline error is an over-length value. The same
  Zod schema runs again on the server.
*/
export function CheckoutFields({
  form,
  zone,
  busy,
  serverError,
  defaultEmail,
  onSubmit,
}: CheckoutFieldsProps) {
  const { register, handleSubmit, formState } = form;
  const { errors } = formState;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {serverError ? (
        <p
          role="alert"
          className="rounded-lg border border-danger bg-mist p-3 text-sm text-danger"
        >
          {serverError}
        </p>
      ) : null}

      <Field id="fullName" label="Full name" error={errors.fullName?.message}>
        <input
          id="fullName"
          autoComplete="name"
          {...register("fullName")}
          aria-invalid={errors.fullName ? "true" : "false"}
          className={fieldClass(errors.fullName?.message)}
        />
      </Field>

      <Field
        id="phone"
        label="Phone / WhatsApp"
        error={errors.phone?.message}
        hint="Optional. Add a number if you would like Jaynie to confirm payment and delivery on WhatsApp."
      >
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="08012345678"
          {...register("phone")}
          aria-invalid={errors.phone ? "true" : "false"}
          className={fieldClass(errors.phone?.message)}
        />
      </Field>

      <fieldset>
        <legend className="text-sm font-medium text-onyx">Delivery zone</legend>
        <div className="mt-3 flex flex-col gap-3">
          {ZONES.map((value) => {
            const fee = DELIVERY_FEES_KOBO[value];
            const selected = zone === value;

            return (
              <label
                key={value}
                className={`flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-lg border p-4 transition-colors ${
                  selected ? "border-onyx bg-mist" : "border-line bg-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    value={value}
                    {...register("deliveryZone")}
                    className="h-5 w-5 accent-onyx"
                  />
                  <span className="flex items-center gap-2 text-sm font-medium text-onyx">
                    <MapPin
                      className="h-5 w-5 text-ink-muted"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    {DELIVERY_ZONE_LABELS[value]}
                  </span>
                </span>
                <span className="text-sm font-semibold text-onyx">
                  {fee === null ? "To be confirmed" : formatNaira(fee)}
                </span>
              </label>
            );
          })}
        </div>
        {errors.deliveryZone ? (
          <p className="mt-2 text-sm text-danger">{errors.deliveryZone.message}</p>
        ) : null}
      </fieldset>


      <Field
        id="addressLine"
        label="Address"
        error={errors.addressLine?.message}
      >
        <input
          id="addressLine"
          autoComplete="address-line1"
          {...register("addressLine")}
          aria-invalid={errors.addressLine ? "true" : "false"}
          className={fieldClass(errors.addressLine?.message)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="city" label="City" error={errors.city?.message}>
          <input
            id="city"
            autoComplete="address-level2"
            {...register("city")}
            aria-invalid={errors.city ? "true" : "false"}
            className={fieldClass(errors.city?.message)}
          />
        </Field>

        <Field id="state" label="State / Region" error={errors.state?.message}>
          <input
            id="state"
            autoComplete="address-level1"
            {...register("state")}
            aria-invalid={errors.state ? "true" : "false"}
            className={fieldClass(errors.state?.message)}
          />
        </Field>
      </div>

      <Field id="country" label="Country" error={errors.country?.message}>
        <input
          id="country"
          autoComplete="country-name"
          {...register("country")}
          aria-invalid={errors.country ? "true" : "false"}
          className={fieldClass(errors.country?.message)}
        />
      </Field>

      <Field id="note" label="Order note" error={errors.note?.message}>
        <textarea
          id="note"
          rows={3}
          placeholder="Anything Jaynie should know, such as a landmark or a preferred call time."
          {...register("note")}
          aria-invalid={errors.note ? "true" : "false"}
          className={`mt-2 w-full rounded-lg border bg-mist p-4 text-base text-onyx placeholder:text-ink-muted ${
            errors.note ? "border-danger" : "border-line"
          }`}
        />
      </Field>

      <div className="rounded-lg bg-mist p-3 text-xs text-ink-muted">
        <p>
          No payment online. Jaynie will contact you on WhatsApp within 24 hours
          to confirm payment (transfer or pay on delivery) and delivery date.
        </p>
        <p className="mt-2">This order will be placed as {defaultEmail}.</p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="flex h-12 items-center justify-center rounded bg-onyx px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Placing your order" : "Place order"}
      </button>
    </form>
  );
}
