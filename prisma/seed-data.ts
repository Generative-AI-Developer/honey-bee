// Sample catalogue for development and first launch. Prices are in rupees here and
// converted to paisa by the seed script. Edit freely or manage everything in the admin.

export const categories = [
  { slug: "sidr-beri", name: "Sidr & Beri", description: "Prized honey from wild sidr (beri) groves in Karak and the Salt Range.", sortOrder: 1 },
  { slug: "acacia-phulai", name: "Acacia & Phulai", description: "Light, mild honey from phulai (acacia) blossoms across Punjab.", sortOrder: 2 },
  { slug: "wildflower-forest", name: "Wildflower & Forest", description: "Bold, mineral-rich honey from mountain forests and wildflowers.", sortOrder: 3 },
  { slug: "infused-specialty", name: "Infused & Specialty", description: "Honey blended with kalonji, ajwain and other traditional ingredients.", sortOrder: 4 },
  { slug: "honeycomb", name: "Honeycomb", description: "Raw honeycomb straight from the frame, the purest form of honey.", sortOrder: 5 },
  { slug: "gift-boxes", name: "Gift Boxes", description: "Curated honey gift sets for Eid, weddings and corporate gifting.", sortOrder: 6 },
] as const;

type SeedVariant = { name: string; price: number; compareAt?: number; stock: number; weightGrams: number };

export type SeedProduct = {
  slug: string;
  name: string;
  category: (typeof categories)[number]["slug"];
  image: string;
  shortDescription: string;
  description: string;
  origin: string;
  floralSource: string;
  harvest: string;
  benefits: string[];
  tags: string[];
  featured?: boolean;
  soldCount: number;
  variants: SeedVariant[];
};

const std = (p250: number, p500: number, p1k: number, stock = [40, 60, 30], compare?: [number?, number?, number?]): SeedVariant[] => [
  { name: "250g", price: p250, compareAt: compare?.[0], stock: stock[0]!, weightGrams: 400 },
  { name: "500g", price: p500, compareAt: compare?.[1], stock: stock[1]!, weightGrams: 700 },
  { name: "1kg", price: p1k, compareAt: compare?.[2], stock: stock[2]!, weightGrams: 1300 },
];

export const products: SeedProduct[] = [
  {
    slug: "sidr-beri-honey",
    name: "Sidr (Beri) Honey",
    category: "sidr-beri",
    image: "sidr",
    shortDescription: "Thick, dark amber honey from wild sidr blossoms. Rich, caramel-like and gently warming.",
    description:
      "Sidr honey is one of the most prized honeys in the world. Our beekeepers move their hives to the sidr groves of Karak each autumn, when the trees bloom for just a few weeks.\n\nThe result is a thick, slow-pouring honey with a deep caramel flavour and a gentle warmth at the finish. It is cold-extracted and never heated or filtered, so it keeps its natural enzymes and pollen.",
    origin: "Karak, Khyber Pakhtunkhwa",
    floralSource: "Ziziphus (Sidr / Beri)",
    harvest: "Oct 2026",
    benefits: ["Traditionally used to soothe the throat", "Natural energy without refined sugar", "Rich in antioxidants"],
    tags: ["bestseller", "raw", "premium"],
    featured: true,
    soldCount: 1240,
    variants: std(1750, 3200, 6000, [35, 7, 18], [undefined, 3800, 6900]),
  },
  {
    slug: "sidr-royal-reserve",
    name: "Sidr Royal Reserve",
    category: "sidr-beri",
    image: "sidr-royal",
    shortDescription: "Our finest single-grove sidr, harvested in tiny batches from century-old trees.",
    description:
      "Royal Reserve comes from a single grove of very old sidr trees in the hills of Karak. Only a few hundred jars are produced each season. Expect an intensely aromatic honey with notes of toffee and dried fruit.",
    origin: "Karak, Khyber Pakhtunkhwa",
    floralSource: "Ziziphus (Sidr)",
    harvest: "Oct 2026",
    benefits: ["Single-origin, single-grove", "Very low moisture, very thick", "Ideal for gifting"],
    tags: ["premium", "limited"],
    featured: true,
    soldCount: 310,
    variants: [
      { name: "500g", price: 5400, stock: 12, weightGrams: 700 },
      { name: "1kg", price: 10200, stock: 3, weightGrams: 1300 },
    ],
  },
  {
    slug: "acacia-phulai-honey",
    name: "Acacia (Phulai) Honey",
    category: "acacia-phulai",
    image: "acacia",
    shortDescription: "Light golden honey with a clean, delicate sweetness. Slow to crystallise.",
    description:
      "Phulai (Acacia modesta) grows wild across the Salt Range and Potohar plateau. Its honey is pale gold, mild and floral, making it a favourite for children, tea and baking.",
    origin: "Chakwal, Punjab",
    floralSource: "Acacia modesta (Phulai)",
    harvest: "Apr 2026",
    benefits: ["Mild taste kids love", "Stays liquid for longer", "Perfect in green tea"],
    tags: ["mild", "raw"],
    featured: true,
    soldCount: 980,
    variants: std(1350, 2400, 4500),
  },
  {
    slug: "wild-forest-honey",
    name: "Wild Forest Honey",
    category: "wildflower-forest",
    image: "forest",
    shortDescription: "Dark, bold honey from the pine and wildflower forests of Swat Valley.",
    description:
      "Collected from hives high in the forests of Swat, this honey carries the character of mountain wildflowers and forest nectar. It is robust, slightly malty and full of minerals.",
    origin: "Swat Valley, Khyber Pakhtunkhwa",
    floralSource: "Mountain wildflowers",
    harvest: "Jul 2026",
    benefits: ["High in minerals", "Bold flavour for cooking", "Raw and unfiltered"],
    tags: ["new", "raw"],
    featured: true,
    soldCount: 520,
    variants: std(1550, 2800, 5300),
  },
  {
    slug: "kalonji-black-seed-honey",
    name: "Black Seed (Kalonji) Honey",
    category: "infused-specialty",
    image: "kalonji",
    shortDescription: "Raw honey from bees foraging on kalonji (Nigella sativa) flowers. Deep and herbal.",
    description:
      "Kalonji honey is produced when bees forage on blooming Nigella sativa fields. It is dark, slightly bitter-sweet and herbal, cherished in Pakistani households as a daily morning spoonful.",
    origin: "Thal Desert, Punjab",
    floralSource: "Nigella sativa (Kalonji)",
    harvest: "Mar 2026",
    benefits: ["Traditional daily tonic", "Distinctive herbal taste", "Lab-tested purity"],
    tags: ["sale", "herbal"],
    featured: true,
    soldCount: 760,
    variants: std(1650, 2950, 5600, [40, 50, 25], [undefined, 3400, undefined]),
  },
  {
    slug: "orange-blossom-honey",
    name: "Orange Blossom Honey",
    category: "acacia-phulai",
    image: "orange",
    shortDescription: "Fragrant, citrusy honey from the kinnow orchards of Sargodha.",
    description:
      "Every spring the kinnow orchards of Sargodha burst into bloom. This honey captures that moment: bright, fragrant and lightly citrusy. Wonderful on toast, yoghurt and in lemonade.",
    origin: "Sargodha, Punjab",
    floralSource: "Citrus (Kinnow)",
    harvest: "Mar 2026",
    benefits: ["Fresh citrus aroma", "Light and fruity", "Great for breakfast"],
    tags: ["fruity"],
    soldCount: 410,
    variants: std(1250, 2200, 4100),
  },
  {
    slug: "raw-honeycomb",
    name: "Raw Honeycomb",
    category: "honeycomb",
    image: "comb",
    shortDescription: "Whole honeycomb cut straight from the frame. Chew the wax, enjoy the honey.",
    description:
      "Honeycomb is honey exactly as the bees made it, sealed in edible beeswax cells. Cut a piece for your cheese board, breakfast or simply eat it by the spoonful.",
    origin: "Neelum Valley, Kashmir",
    floralSource: "Mountain wildflowers",
    harvest: "Aug 2026",
    benefits: ["Completely unprocessed", "Edible natural beeswax", "A striking centrepiece"],
    tags: ["limited", "raw"],
    soldCount: 290,
    variants: [
      { name: "400g", price: 3600, stock: 5, weightGrams: 650 },
      { name: "800g", price: 6800, stock: 9, weightGrams: 1150 },
    ],
  },
  {
    slug: "multiflora-honey",
    name: "Multiflora Honey",
    category: "wildflower-forest",
    image: "multiflora",
    shortDescription: "Everyday raw honey from the mixed blossoms of the Punjab plains.",
    description:
      "Our most affordable raw honey, collected from a mix of seasonal blossoms across the Punjab plains. Balanced, versatile and perfect for daily use in tea, cooking and baking.",
    origin: "Punjab plains",
    floralSource: "Mixed seasonal flowers",
    harvest: "May 2026",
    benefits: ["Great everyday value", "Versatile in the kitchen", "100% pure"],
    tags: ["value"],
    soldCount: 1500,
    variants: std(950, 1650, 3100, [80, 120, 60]),
  },
  {
    slug: "ajwain-honey",
    name: "Ajwain Honey",
    category: "infused-specialty",
    image: "ajwain",
    shortDescription: "Rare honey from carom (ajwain) blossoms, with a spicy, thyme-like finish.",
    description:
      "Ajwain honey comes from bees foraging on carom seed flowers. It is amber, slightly spicy and aromatic. A traditional favourite for digestion and for winter.",
    origin: "Bahawalpur, Punjab",
    floralSource: "Trachyspermum ammi (Ajwain)",
    harvest: "Feb 2026",
    benefits: ["Warming in winter", "Traditional digestive aid", "Unique spicy aroma"],
    tags: ["herbal"],
    soldCount: 180,
    variants: std(1500, 2700, 5100, [25, 30, 15]),
  },
  {
    slug: "shahad-e-shifa-blend",
    name: "Shahad-e-Shifa Blend",
    category: "infused-specialty",
    image: "shahad",
    shortDescription: "Sidr honey blended with kalonji, ginger and turmeric for a daily wellness spoon.",
    description:
      "A house blend of raw sidr honey with finely ground kalonji, ginger and turmeric. Take a spoonful each morning or stir into warm water.",
    origin: "Blended in Lahore",
    floralSource: "Sidr honey with spices",
    harvest: "Sep 2026",
    benefits: ["Ready-made wellness blend", "No added sugar", "Small-batch"],
    tags: ["new"],
    soldCount: 95,
    variants: [
      { name: "250g", price: 1900, stock: 30, weightGrams: 400 },
      { name: "500g", price: 3500, stock: 24, weightGrams: 700 },
    ],
  },
  {
    slug: "harvest-gift-box",
    name: "Harvest Gift Box (3 jars)",
    category: "gift-boxes",
    image: "gift",
    shortDescription: "Sidr, Acacia and Wild Forest honey (250g each) in a handmade gift box.",
    description:
      "Three of our favourite honeys in a handmade box with a hand-written card. A thoughtful gift for Eid, weddings or anyone who loves good food.",
    origin: "Assorted",
    floralSource: "Sidr, Acacia, Wildflower",
    harvest: "2026",
    benefits: ["Ready to gift", "Includes a personal card", "Free gift wrapping"],
    tags: ["gift"],
    featured: true,
    soldCount: 640,
    variants: [{ name: "3 × 250g", price: 6900, compareAt: 7800, stock: 40, weightGrams: 1600 }],
  },
  {
    slug: "royal-trio-gift-box",
    name: "Royal Trio Gift Box",
    category: "gift-boxes",
    image: "gift-trio",
    shortDescription: "Sidr Royal Reserve, Kalonji and Honeycomb in a premium wooden box.",
    description:
      "Our premium gift set: Sidr Royal Reserve, Black Seed honey and a piece of raw honeycomb, presented in a reusable wooden box with a honey dipper.",
    origin: "Assorted",
    floralSource: "Sidr, Kalonji, Wildflower",
    harvest: "2026",
    benefits: ["Wooden keepsake box", "Includes honey dipper", "Corporate orders welcome"],
    tags: ["gift", "premium"],
    soldCount: 120,
    variants: [{ name: "Box", price: 12500, stock: 15, weightGrams: 2400 }],
  },
];

export const shippingZones = [
  {
    name: "Lahore",
    cities: ["lahore"],
    rates: [
      { name: "Standard", carrier: "TCS", baseFee: 200, perKgFee: 50, freeOver: 5000, minDays: 1, maxDays: 2 },
      { name: "Same / next day", carrier: "Honey Bee rider", baseFee: 450, perKgFee: 0, freeOver: null, minDays: 0, maxDays: 1 },
    ],
  },
  {
    name: "Major cities",
    cities: ["karachi", "islamabad", "rawalpindi", "faisalabad", "multan", "peshawar", "gujranwala", "sialkot", "hyderabad", "quetta"],
    rates: [
      { name: "Standard", carrier: "TCS", baseFee: 250, perKgFee: 80, freeOver: 5000, minDays: 2, maxDays: 4 },
      { name: "Express", carrier: "Leopards", baseFee: 450, perKgFee: 120, freeOver: null, minDays: 1, maxDays: 2 },
    ],
  },
  {
    name: "Rest of Pakistan",
    cities: [],
    isDefault: true,
    rates: [{ name: "Standard", carrier: "Leopards", baseFee: 350, perKgFee: 100, freeOver: 7000, minDays: 3, maxDays: 6 }],
  },
];

export const discounts = [
  { code: "HONEY15", description: "15% off your first order", type: "PERCENT" as const, value: 15, firstOrderOnly: true, perUserLimit: 1, maxDiscount: 250000 },
  { code: "FREESHIP", description: "Free delivery on orders over Rs 3,000", type: "FREE_SHIPPING" as const, value: 0, minSubtotal: 300000 },
  { code: "EID500", description: "Rs 500 off orders over Rs 6,000", type: "FIXED" as const, value: 50000, minSubtotal: 600000, usageLimit: 500 },
];

export const banners = [
  { placement: "HERO" as const, title: "Pure, raw honey from Pakistan's wild valleys", subtitle: "Unheated, unfiltered and lab-tested. Sourced directly from beekeepers in Karak, Swat and Kashmir and delivered to your door anywhere in Pakistan.", ctaLabel: "Shop all honey", ctaHref: "/shop", sortOrder: 0 },
  { placement: "PROMO" as const, title: "15% off your first order", subtitle: "Use code HONEY15 at checkout. Valid on all raw honey.", ctaLabel: "Shop the harvest", ctaHref: "/shop", sortOrder: 0 },
];

export const pages = [
  {
    slug: "about",
    title: "Our story",
    seoDescription: "How Honey Bee sources raw, lab-tested honey directly from family beekeepers across Pakistan.",
    body: `## From the hive to your home, nothing added

We work with more than 40 family beekeepers who follow the flowers across Pakistan: sidr trees in Karak, phulai in the Salt Range, wildflowers in Swat and Kashmir.

Each batch is cold-extracted, tested in an independent laboratory, and jarred by hand in Lahore.

## Our promise

- **Traceable:** every jar is linked to its farm and harvest date.
- **Tested:** independent purity and moisture tests on every batch.
- **Fair:** we pay beekeepers directly and fairly.`,
  },
  {
    slug: "shipping",
    title: "Shipping & delivery",
    seoDescription: "Delivery times, charges and courier partners for Honey Bee orders across Pakistan.",
    body: `## Where we deliver

We deliver to every city and town in Pakistan through TCS and Leopards Courier.

## Delivery times

- **Lahore:** 1–2 working days (same/next-day rider available)
- **Major cities:** 2–4 working days
- **Rest of Pakistan:** 3–6 working days

## Charges

Delivery charges are calculated at checkout based on your city and parcel weight. Orders above the free-delivery threshold shown at checkout ship free.

## Tracking

As soon as your order ships you'll receive an email with the courier name and tracking number. You can also track any order on our [Track order](/track-order) page.`,
  },
  {
    slug: "returns",
    title: "Returns & refunds",
    seoDescription: "Honey Bee's 7-day quality guarantee, returns and refund policy.",
    body: `## 7-day quality guarantee

If your jar arrives damaged, leaking or you're unhappy with the quality, tell us within **7 days of delivery** and we'll replace it or refund you.

## How to request a return

1. Log in and open the order under **My account → Orders**.
2. Click **Request a return** and tell us what went wrong (photos help).
3. We'll reply within one working day with next steps.

## Refunds

Refunds for online payments go back to the original payment method. Cash on Delivery orders are refunded by bank transfer or Easypaisa/JazzCash. Refunds are processed within 5–7 working days of approval.

Opened jars can only be returned for quality issues.`,
  },
  {
    slug: "faq",
    title: "Frequently asked questions",
    seoDescription: "Answers to common questions about Honey Bee honey, orders, payments and delivery.",
    body: `## Is your honey really pure?

Yes. Every batch is tested by an independent lab for adulteration (added sugar syrups), moisture and HMF. The report is available on each product page.

## Why has my honey crystallised?

Crystallisation is natural and a sign of raw honey. Place the jar in warm (not hot) water to make it liquid again.

## Which payment methods do you accept?

Cash on Delivery, JazzCash, Easypaisa, debit/credit cards and bank transfer.

## Can I change or cancel my order?

You can cancel from your account while the order is pending or confirmed. Once it has been packed, contact us on WhatsApp.`,
  },
  {
    slug: "privacy",
    title: "Privacy policy",
    seoDescription: "How Honey Bee collects, uses and protects your personal information.",
    body: `## What we collect

Your name, email, phone number and delivery address so we can process and deliver your orders, plus your order history.

## How we use it

Only to fulfil orders, provide customer support and (if you opt in) send occasional newsletters. We never sell your data.

## Payments

Card and wallet payments are processed by our payment partners. We never see or store your card details.

## Your rights

You can update your details in your account or ask us to delete your data at any time.`,
  },
  {
    slug: "terms",
    title: "Terms & conditions",
    seoDescription: "Terms and conditions for shopping at Honey Bee.",
    body: `## Orders

All orders are subject to availability and confirmation. Prices are in Pakistani Rupees and include applicable taxes.

## Payments

Unpaid online orders are automatically cancelled if payment isn't completed within the time shown at checkout.

## Liability

Honey should not be given to infants under 12 months of age.`,
  },
];
