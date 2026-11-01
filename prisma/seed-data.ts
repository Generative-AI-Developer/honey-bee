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
    title: "About us",
    seoDescription: "Abdul Sami Honey Enterprises (AS Honey) brings pure, raw, lab-tested honey from Pakistan's best honey regions to homes nationwide.",
    body: `## Who we are

**Abdul Sami Honey Enterprises** is the business behind **AS Honey**. Our aim is simple: to bring pure, natural honey from Pakistan's best honey-producing regions to homes across the country, with nothing added and nothing taken away.

## Where our honey comes from

Pakistan is home to some of the world's most loved honeys, and each one tastes of the flowers the bees visited:

- **Sidr (beri)** from the wild sidr groves of Karak, rich, thick and amber.
- **Acacia (phulai)** from the Salt Range, light, mild and slow to crystallise.
- **Wildflower and forest honey** from the valleys of Swat and Kashmir.
- **Honeycomb and specialty honeys** for those who like their honey just as the bees made it.

## How we keep it pure

- **Raw and unheated:** our honey is not cooked or blended with sugar syrups.
- **Lab-tested:** every batch is tested for purity before it is packed. Ask us for the report for your jar.
- **Carefully packed:** sealed jars, packed to reach you safely anywhere in Pakistan.

## Our promise to you

- **Pure honey, every time.** If it isn't right, tell us.
- **Cash on Delivery** across Pakistan, plus bank transfer and mobile wallets.
- **Easy returns** within 7 days if there's a quality problem.
- **Real people to talk to** on WhatsApp, phone or email.

## Get in touch

Questions about a product, a bulk order or corporate gifting? [Contact us](/contact), we'd love to hear from you. Or [browse our honey](/shop).`,
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

// Starter articles for the blog (Admin → Blog). Plain, practical guides; no medical claims.
export const blogPosts = [
  {
    slug: "how-to-tell-if-honey-is-pure",
    title: "How to tell if honey is pure (and which home tests to ignore)",
    excerpt: "The water, thumb and flame tests you see online can't really tell pure honey from adulterated honey. Here is what actually works when you buy.",
    publishedAt: new Date("2026-10-30T09:00:00+05:00"),
    body: `Almost everyone in Pakistan has heard a "trick" for spotting fake honey: drop it in water, put it on your thumb, or try to set it alight. They are fun to try, but they cannot tell you whether honey is pure.

## Why the popular home tests don't work

- **The water test:** thick honey sinks and dissolves slowly, but so does thick sugar syrup. Runny pure honey can dissolve quickly too.
- **The thumb test:** whether honey spreads or stays put depends on its moisture and temperature, not its purity.
- **The flame test:** a matchstick dipped in honey may or may not light depending on how wet it is. It says nothing about added sugar.
- **The paper or cloth test:** absorption depends on water content, which varies naturally between harvests.

Modern adulteration is done with refined syrups made to look, taste and behave like honey, so simple kitchen tests are easily fooled.

## What actually tells you honey is pure

Purity is measured in a **laboratory**. Common checks include:

- **Moisture content:** good honey is usually below about 20% water; wetter honey can ferment.
- **Sugar profile:** shows whether the natural balance of fructose and glucose has been changed.
- **HMF (hydroxymethylfurfural):** a high level suggests the honey was overheated or is old.
- **Tests for added syrups:** specialised tests detect sugars from cane or corn added to honey.

## How to buy with confidence

1. **Ask for a lab report.** A seller who tests every batch will happily show you the results.
2. **Know where it comes from.** The region, the flower (for example sidr or acacia) and the harvest season should be clear on the label.
3. **Be wary of prices that are too good to be true.** Real honey takes bees, flowers and time.
4. **Don't fear crystallisation.** Honey that turns solid is natural, not fake. [Read why honey crystallises](/blog/why-honey-crystallises-and-how-to-store-it).

Every batch we sell is lab-tested. If you would like to see the report for your jar, message us on WhatsApp.`,
  },
  {
    slug: "why-honey-crystallises-and-how-to-store-it",
    title: "Why honey crystallises, and how to store it",
    excerpt: "Crystallised honey hasn't gone bad and isn't fake. Here's why it happens, how to make it runny again, and the best way to store a jar.",
    publishedAt: new Date("2026-10-26T09:00:00+05:00"),
    body: `Opened your jar to find it cloudy or solid? Good news: your honey is fine. Crystallisation is one of the most natural things honey does.

## Why it happens

Honey is mostly two natural sugars, **fructose** and **glucose**, with very little water. Glucose doesn't stay dissolved for long, so over time it forms tiny crystals.

- Honey with more glucose, such as mustard or wildflower honey, crystallises within weeks.
- Honey with more fructose, such as acacia, can stay runny for many months.
- Cool temperatures (around 10–15°C) speed it up, which is why it happens faster in winter.

Crystallised honey tastes the same and is just as good. Many people prefer it, because it spreads on toast without dripping.

## How to make it runny again

1. Stand the closed jar in a bowl of **warm water** (not boiling, comfortably hot to the touch).
2. Leave it for 15–30 minutes and stir now and then.
3. Repeat if needed.

Avoid the microwave and very hot water. Strong heat can spoil the flavour and the natural qualities of raw honey.

## How to store honey

- **Close the lid tightly.** Honey absorbs moisture from the air, and wet honey can ferment.
- **Keep it at room temperature,** away from direct sunlight and the stove.
- **Don't refrigerate it.** The fridge makes honey crystallise faster.
- **Use a clean, dry spoon** every time.

Stored this way, honey keeps for a very long time. The "best before" date is mostly about flavour and texture.`,
  },
  {
    slug: "sidr-beri-honey-guide",
    title: "Sidr (Beri) honey: a guide to Pakistan's most prized honey",
    excerpt: "Where sidr honey comes from, why it costs more than other honey, what it tastes like and how to make the most of a jar.",
    publishedAt: new Date("2026-10-20T09:00:00+05:00"),
    body: `Ask anyone in Pakistan about the finest honey and you will hear one name: **sidr**, also called **beri**. Here's what makes it special.

## Where it comes from

Sidr honey is made by bees that feed on the blossoms of the **sidr (beri) tree**, *Ziziphus*. The trees grow wild in dry, hilly areas, and in Pakistan some of the best-known sidr honey comes from **Karak** and the surrounding districts of Khyber Pakhtunkhwa.

The trees flower for only a few weeks each year, in **autumn**, so beekeepers move their hives to the sidr groves for a short, intense harvest.

## Why it costs more

- **A short season:** the bees have only a few weeks of sidr blossom each year.
- **Small harvests:** wild trees and dry weather mean limited yields.
- **High demand:** sidr is a traditional favourite and a popular gift, especially around Eid and weddings.

Because it's valuable, sidr is also one of the honeys most often faked. Buying from a seller who lab-tests every batch matters. [See how to tell if honey is pure](/blog/how-to-tell-if-honey-is-pure).

## What it tastes like

Sidr honey is usually **thick and amber to dark**, with a rich, warm, slightly caramel-like flavour and a gentle aftertaste. It tends to stay runny for longer than many other honeys.

## Ways to enjoy it

- A spoonful on its own, or stirred into warm (not boiling) water with lemon.
- Drizzled over yoghurt, porridge or fresh fruit.
- With paratha or bread for a traditional breakfast.
- As a gift: a jar of sidr is a much-loved present.

[Browse our honey](/shop)`,
  },
  {
    slug: "honey-and-babies-under-one",
    title: "Honey and babies: why not before their first birthday",
    excerpt: "Health experts advise never giving honey, raw or cooked, to babies under 12 months. Here's the simple reason, and when it becomes safe.",
    publishedAt: new Date("2026-10-14T09:00:00+05:00"),
    body: `Honey is a wonderful food for children and adults, with one important exception: **babies under one year old should not have honey.**

## Why

Honey can naturally contain spores of a bacterium called *Clostridium botulinum*. They are harmless to older children and adults, whose digestive systems deal with them easily.

A baby's gut is still developing. In babies under 12 months, the spores can grow and cause a rare but serious illness called **infant botulism**.

## What this means in practice

- **Don't give honey to babies under 12 months,** not even a small taste or on a dummy.
- **This applies to all honey:** raw, pasteurised, local or imported.
- **Cooking doesn't make it safe** for infants, so avoid baked foods made with honey too.
- **Check labels** on baby foods and snacks for honey.

## When is it safe?

From their **first birthday** onwards, honey is fine for children as part of a balanced diet. As with any sweet food, small amounts are best, and brush their teeth afterwards.

If you are ever unsure what to feed your baby, ask your doctor or health visitor.`,
  },
];
