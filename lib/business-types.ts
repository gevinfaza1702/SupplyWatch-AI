import type { BusinessType } from "@/types/database";

export const BUSINESS_TYPE_VALUES = [
  "bakery",
  "coffee_shop",
  "restaurant",
  "warung_makan",
  "catering",
  "beverage_shop",
  "fried_snack",
  "grocery_retail",
] as const satisfies readonly BusinessType[];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  bakery: "Toko roti / bakery",
  coffee_shop: "Kedai kopi",
  restaurant: "Restoran",
  warung_makan: "Warung makan",
  catering: "Katering",
  beverage_shop: "Minuman / es teh / boba",
  fried_snack: "Gorengan / snack",
  grocery_retail: "Toko sembako",
};

export const BUSINESS_TYPE_OPTIONS = BUSINESS_TYPE_VALUES.map((value) => ({
  value,
  label: BUSINESS_TYPE_LABELS[value],
}));

export function isBusinessType(value: string | null | undefined): value is BusinessType {
  return Boolean(value && (BUSINESS_TYPE_VALUES as readonly string[]).includes(value));
}

export function businessTypeLabel(value: string | null | undefined) {
  return isBusinessType(value) ? BUSINESS_TYPE_LABELS[value] : null;
}
