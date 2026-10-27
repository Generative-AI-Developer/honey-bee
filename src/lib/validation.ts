import { z } from "zod";
import { PROVINCES } from "@/lib/site";

/** Pakistani mobile number: 03XXXXXXXXX, +923XXXXXXXXX or 923XXXXXXXXX (spaces/dashes allowed). */
export const pkPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(\+92|92|0)3\d{9}$/.test(v), "Enter a valid mobile number, e.g. 0300 1234567")
  .transform((v) => `+92${v.replace(/^(\+92|92|0)/, "")}`);

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(80),
  phone: pkPhone,
  line1: z.string().trim().min(5, "Please enter your street address.").max(160),
  line2: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Please enter your city.").max(60),
  province: z.enum(PROVINCES, { message: "Please choose your province." }),
  postalCode: z.string().trim().max(10).optional().or(z.literal("")),
});

export type AddressInput = z.input<typeof addressSchema>;

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(128)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Use letters and at least one number.");
