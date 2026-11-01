// Static brand facts used in metadata and structured data.
// Editable business details (phone, address, bank, fees) live in Admin → Settings.
export const site = {
  name: "Abdul Sami Honey Enterprises",
  tagline: "Pure, raw honey from Pakistan's wild valleys",
  description:
    "Raw, unfiltered and lab-tested honey sourced directly from beekeepers in Karak, Swat and Kashmir. Sidr, Acacia, Kalonji and more, with Cash on Delivery across Pakistan.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_PK",
  currency: "PKR",
  country: "PK",
} as const;

export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
] as const;

export const MAJOR_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Bahawalpur",
  "Sargodha",
  "Abbottabad",
  "Mardan",
  "Sukkur",
  "Gujrat",
  "Sahiwal",
  "Mirpur",
  "Muzaffarabad",
  "Gilgit",
  "Swat",
] as const;
