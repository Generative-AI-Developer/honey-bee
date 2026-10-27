"""Generates the Honey Bee design mockup pages (HTML) rendered to PNG by shoot.mjs."""
from pathlib import Path

OUT = Path(__file__).parent
_uid = [0]


def uid():
    _uid[0] += 1
    return f"g{_uid[0]}"


# ---------- icons (lucide-style strokes) ----------
ICONS = {
    "search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    "bag": '<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    "heart": '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
    "truck": '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    "shield": '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
    "cash": '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    "return": '<path d="M4 10h11a5 5 0 0 1 0 10H9"/><path d="m8 6-4 4 4 4"/>',
    "leaf": '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19 13 11"/>',
    "menu": '<path d="M4 7h16M4 12h16M4 17h16"/>',
    "chev": '<path d="m9 6 6 6-6 6"/>',
    "down": '<path d="m6 9 6 6 6-6"/>',
    "filter": '<path d="M4 6h16M7 12h10M10 18h4"/>',
    "check": '<path d="m5 12 5 5 9-10"/>',
    "lock": '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    "box": '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M12 12 4 7.5M12 12l8-4.5M12 12v9"/>',
    "grid": '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
    "users": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.6c2.2.6 3.5 2.4 3.5 5.4"/>',
    "tag": '<path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="7.5" cy="8" r="1.5"/>',
    "chart": '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    "star": '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    "cog": '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    "map": '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    "bell": '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2Z"/><path d="M10 21h4"/>',
    "image": '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
    "file": '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "minus": '<path d="M5 12h14"/>',
    "x": '<path d="M6 6l12 12M18 6 6 18"/>',
}


def ic(name, size=20, cls=""):
    return (f'<svg class="ic {cls}" width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" '
            f'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{ICONS[name]}</svg>')


# ---------- honey jar illustration ----------
HONEYS = {
    "sidr": ("#E9A21A", "#9C4E06"),
    "acacia": ("#F6CF5A", "#C98B10"),
    "forest": ("#B4560F", "#5A2604"),
    "kalonji": ("#8A3E0B", "#3D1803"),
    "orange": ("#F3B33A", "#B9680A"),
    "comb": ("#F0B428", "#A8620A"),
    "royal": ("#D8860F", "#7A3A05"),
    "gift": ("#E8A01E", "#94500A"),
}


def jar(kind="sidr", label="SIDR", w=160, lid="#3B2A1A"):
    a, b = HONEYS[kind]
    g, sh = uid(), uid()
    h = int(w * 1.25)
    return f'''<svg class="jar" width="{w}" height="{h}" viewBox="0 0 160 200" aria-hidden="true">
  <defs>
    <linearGradient id="{g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>
    <linearGradient id="{sh}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>
  <ellipse cx="80" cy="192" rx="56" ry="6" fill="#000" opacity=".12"/>
  <path d="M34 54 Q30 60 30 72 V170 Q30 188 50 188 H110 Q130 188 130 170 V72 Q130 60 126 54 Z" fill="url(#{g})"/>
  <path d="M34 54 Q30 60 30 72 V170 Q30 188 50 188 H110 Q130 188 130 170 V72 Q130 60 126 54 Z" fill="url(#{sh})"/>
  <rect x="38" y="26" width="84" height="30" rx="6" fill="{lid}"/>
  <rect x="38" y="44" width="84" height="5" fill="#000" opacity=".18"/>
  <path d="M38 34 h84" stroke="#fff" stroke-opacity=".15" stroke-width="2"/>
  <rect x="42" y="96" width="76" height="56" rx="6" fill="#FFF8EA"/>
  <path d="M80 104 l6 3.5 v7 l-6 3.5 -6-3.5 v-7z" fill="none" stroke="{b}" stroke-width="1.6"/>
  <text x="80" y="132" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="700" font-size="11" fill="#3B2A1A" letter-spacing="1">{label}</text>
  <text x="80" y="144" text-anchor="middle" font-family="Inter, sans-serif" font-size="6.5" fill="#7a6650" letter-spacing="1.5">RAW · PURE</text>
</svg>'''


def stars(r=5, n=None):
    full = "★" * int(round(r))
    empty = "★" * (5 - int(round(r)))
    cnt = f' <span class="muted">({n})</span>' if n is not None else ""
    return f'<span class="stars">{full}<span class="off">{empty}</span></span>{cnt}'


def rs(v):
    return f"Rs {v:,}"


# ---------- shared chrome ----------
def head(title, extra=""):
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">{extra}</head><body>'''


LOGO = '''<a class="logo" href="#"><svg width="34" height="34" viewBox="0 0 40 40"><path d="M20 3 35 11.5v17L20 37 5 28.5v-17z" fill="#E9A21A"/><path d="M20 10l8.5 5v10L20 30l-8.5-5V15z" fill="#2B1D0E"/><path d="M15 18h10M15 22h10" stroke="#E9A21A" stroke-width="2"/></svg><span>Honey<b>Bee</b></span></a>'''


def store_header(active="", cart=2):
    nav = ["Shop", "Raw Honey", "Comb & Specialty", "Gift Boxes", "Our Story"]
    links = "".join(f'<a href="#" class="{"on" if n == active else ""}">{n}</a>' for n in nav)
    return f'''<div class="announce">Free delivery on orders over Rs 5,000 &nbsp;·&nbsp; Cash on Delivery across Pakistan &nbsp;·&nbsp; Lab-tested purity</div>
<header class="site-header"><div class="wrap hrow">
  <button class="icon-btn mobile-only" aria-label="Menu">{ic("menu", 22)}</button>
  {LOGO}
  <nav class="main-nav">{links}</nav>
  <div class="search desktop-only">{ic("search", 18)}<span>Search sidr, acacia, comb…</span></div>
  <div class="h-actions">
    <button class="icon-btn mobile-only">{ic("search", 22)}</button>
    <button class="icon-btn desktop-only">{ic("heart", 22)}</button>
    <button class="icon-btn desktop-only">{ic("user", 22)}</button>
    <button class="icon-btn cart-btn">{ic("bag", 22)}<span class="badge">{cart}</span></button>
  </div>
</div></header>'''


FOOTER = f'''<footer class="site-footer"><div class="wrap">
  <div class="f-grid">
    <div class="f-brand">{LOGO}<p>Raw, unprocessed honey sourced directly from beekeepers in Swat, Karak, Thal and the Kashmir valleys.</p>
      <div class="pay-row"><span class="pm">COD</span><span class="pm">JazzCash</span><span class="pm">Easypaisa</span><span class="pm">Visa / Master</span><span class="pm">Bank</span></div></div>
    <div><h4>Shop</h4><a>All honey</a><a>Sidr (Beri)</a><a>Acacia (Phulai)</a><a>Honeycomb</a><a>Gift boxes</a></div>
    <div><h4>Help</h4><a>Track your order</a><a>Shipping &amp; delivery</a><a>Returns &amp; refunds</a><a>FAQ</a><a>Contact us</a></div>
    <div><h4>Get 10% off your first order</h4><p>Harvest news, recipes and early access to seasonal batches.</p>
      <div class="news"><input placeholder="Your email"><button class="btn btn-dark">Subscribe</button></div>
      <p class="small muted">WhatsApp: +92 300 0000000 · Lahore, Pakistan</p></div>
  </div>
  <div class="f-bottom"><span>© 2026 Honey Bee. All rights reserved.</span><span>Privacy · Terms · Refund policy</span></div>
</div></footer>'''

PRODUCTS = [
    ("sidr", "SIDR", "Sidr (Beri) Honey", "Karak, KPK", 3200, 3800, 4.9, 214, "Bestseller"),
    ("acacia", "ACACIA", "Acacia (Phulai) Honey", "Chakwal, Punjab", 2400, None, 4.8, 167, None),
    ("forest", "FOREST", "Wild Forest Honey", "Swat Valley", 2800, None, 4.7, 98, "New harvest"),
    ("kalonji", "KALONJI", "Black Seed (Kalonji) Honey", "Thal Desert", 2950, 3400, 4.8, 121, "-13%"),
    ("orange", "ORANGE", "Orange Blossom Honey", "Sargodha", 2200, None, 4.6, 76, None),
    ("comb", "COMB", "Raw Honeycomb", "Kashmir", 3600, None, 4.9, 58, "Limited"),
    ("royal", "ROYAL", "Sidr Royal Reserve", "Karak, KPK", 5400, None, 5.0, 41, "Premium"),
    ("gift", "GIFT", "Harvest Gift Box (3 jars)", "Assorted", 6900, 7800, 4.9, 89, "Gift"),
    ("acacia", "MULTI", "Multiflora Honey", "Punjab plains", 1650, None, 4.5, 203, None),
]


def pcard(p, compact=False):
    kind, label, name, origin, price, was, r, n, badge = p
    bdg = f'<span class="p-badge {"sale" if badge and badge.startswith("-") else ""}">{badge}</span>' if badge else ""
    wasp = f'<s>{rs(was)}</s>' if was else ""
    return f'''<article class="pcard">
  <div class="p-img t-{kind}">{bdg}<button class="wish">{ic("heart", 18)}</button>{jar(kind, label, 120 if compact else 132)}</div>
  <div class="p-body"><p class="p-origin">{origin}</p><h3>{name}</h3>
    <div class="p-rate">{stars(r, n)}</div>
    <div class="p-foot"><div class="price">{rs(price)} {wasp}<span class="per">500g</span></div>
    <button class="btn btn-honey btn-sm">{ic("bag", 16)} Add</button></div></div>
</article>'''


# ---------- pages ----------
def page_home():
    cats = [("sidr", "SIDR", "Sidr & Beri", "12 products"), ("acacia", "ACACIA", "Acacia & Phulai", "8 products"),
            ("comb", "COMB", "Honeycomb", "4 products"), ("gift", "GIFT", "Gift Boxes", "6 products")]
    catc = "".join(f'<a class="cat t-{k}">{jar(k, l, 120)}<div><h3>{n}</h3><span>{c} {ic("chev", 16)}</span></div></a>' for k, l, n, c in cats)
    feat = "".join(pcard(p) for p in PRODUCTS[:4])
    revs = [("Ayesha K.", "Lahore", "The Sidr honey is the real thing — thick, dark and you can taste the beri flowers. Delivered in 2 days with COD."),
            ("Usman R.", "Islamabad", "Finally a store I trust. Lab reports on every batch and the packaging is beautiful. Ordered the gift box for Eid."),
            ("Hira S.", "Karachi", "Kalonji honey every morning for my family. Fair prices and the WhatsApp support is very responsive.")]
    revc = "".join(f'<figure class="rev">{stars(5)}<blockquote>“{t}”</blockquote><figcaption><b>{a}</b> · {c} <span class="vp">{ic("check", 14)} Verified buyer</span></figcaption></figure>' for a, c, t in revs)
    return head("Honey Bee — Home") + store_header() + f'''
<main>
<section class="hero"><div class="wrap hero-grid">
  <div class="hero-copy">
    <span class="eyebrow">{ic("leaf", 16)} 2026 spring harvest now in stock</span>
    <h1>Pure, raw honey from Pakistan's wild valleys</h1>
    <p class="lead">Unheated, unfiltered and lab-tested. Sourced directly from beekeepers in Karak, Swat and Kashmir — delivered to your door anywhere in Pakistan.</p>
    <div class="cta-row"><a class="btn btn-honey btn-lg">Shop all honey {ic("chev", 18)}</a><a class="btn btn-ghost btn-lg">Our story</a></div>
    <div class="hero-proof"><div class="avatars"><i></i><i></i><i></i><i></i></div><div>{stars(5)} <b>4.9/5</b><br><span class="muted">from 2,300+ happy families</span></div></div>
  </div>
  <div class="hero-art">
    <div class="sun"></div><div class="comb-pattern"></div>
    <div class="jar-a">{jar("forest", "FOREST", 150)}</div>
    <div class="jar-b">{jar("sidr", "SIDR", 210)}</div>
    <div class="jar-c">{jar("acacia", "ACACIA", 150)}</div>
    <div class="float-card"><b>{ic("shield", 18)} Lab-tested</b><span>Every batch, report included</span></div>
  </div>
</div></section>

<section class="trust"><div class="wrap trust-grid">
  <div>{ic("shield", 26)}<b>100% pure &amp; raw</b><span>No sugar syrup, no heating</span></div>
  <div>{ic("cash", 26)}<b>Cash on Delivery</b><span>Pay when it arrives</span></div>
  <div>{ic("truck", 26)}<b>2–4 day delivery</b><span>Nationwide via TCS &amp; Leopards</span></div>
  <div>{ic("return", 26)}<b>Easy returns</b><span>7-day quality guarantee</span></div>
</div></section>

<section class="sec"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow">Shop by type</span><h2>Find your honey</h2></div><a class="link">View all {ic("chev", 16)}</a></div>
  <div class="cat-grid">{catc}</div>
</div></section>

<section class="sec sec-tint"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow">Customer favourites</span><h2>Bestselling honey</h2></div>
    <div class="tabs"><span class="on">Bestsellers</span><span>New harvest</span><span>On sale</span></div></div>
  <div class="p-grid">{feat}</div>
</div></section>

<section class="sec"><div class="wrap"><div class="promo">
  <div><span class="eyebrow light">Limited offer</span><h2>15% off your first order</h2><p>Use code <span class="code">HONEY15</span> at checkout. Valid on all raw honey until 30 November.</p><a class="btn btn-honey btn-lg">Shop the harvest</a></div>
  <div class="promo-art">{jar("royal", "ROYAL", 170, "#E9A21A")}{jar("gift", "GIFT", 130, "#E9A21A")}</div>
</div></div></section>

<section class="sec"><div class="wrap story">
  <div class="story-art t-forest"><div class="comb-pattern dark"></div>{jar("kalonji", "KALONJI", 180)}</div>
  <div><span class="eyebrow">Our story</span><h2>From the hive to your home, nothing added</h2>
  <p>We work with 40+ family beekeepers who follow the flowers across Pakistan — sidr trees in Karak, phulai in the Salt Range, wildflowers in Swat. Each batch is cold-extracted, tested in an independent lab, and jarred by hand in Lahore.</p>
  <ul class="checks"><li>{ic("check", 18)} Traceable to the farm and harvest date</li><li>{ic("check", 18)} Independent purity &amp; moisture tests</li><li>{ic("check", 18)} Fair prices paid directly to beekeepers</li></ul>
  <a class="btn btn-ghost">Read more</a></div>
</div></section>

<section class="sec sec-tint"><div class="wrap">
  <div class="sec-head center"><div><span class="eyebrow">Reviews</span><h2>Loved by families across Pakistan</h2></div></div>
  <div class="rev-grid">{revc}</div>
</div></section>
</main>''' + FOOTER + "</body></html>"


def page_shop():
    cards = "".join(pcard(p, True) for p in PRODUCTS)
    cat = [("All honey", 32, True), ("Sidr & Beri", 12, False), ("Acacia & Phulai", 8, False), ("Wildflower", 6, False), ("Honeycomb", 4, False), ("Gift boxes", 6, False)]
    catl = "".join(f'<label class="chk"><span class="box {"on" if on else ""}">{ic("check", 12) if on else ""}</span>{n}<span class="muted ml">{c}</span></label>' for n, c, on in cat)
    return head("Honey Bee — Shop") + store_header("Shop") + f'''
<main class="wrap">
  <nav class="crumbs">Home {ic("chev", 14)} Shop {ic("chev", 14)} <b>All honey</b></nav>
  <div class="shop-head"><div><h1 class="h1-sm">All honey</h1><p class="muted">Raw, unfiltered honey from across Pakistan — every batch lab-tested.</p></div></div>
  <div class="shop-grid">
    <aside class="filters">
      <div class="f-block"><h4>Category</h4>{catl}</div>
      <div class="f-block"><h4>Price</h4><div class="range"><div class="track"><div class="fill"></div><i style="left:8%"></i><i style="left:72%"></i></div></div>
        <div class="range-vals"><span class="inp">Rs 1,000</span><span>—</span><span class="inp">Rs 6,000</span></div></div>
      <div class="f-block"><h4>Jar size</h4><div class="chips"><span class="chip">250g</span><span class="chip on">500g</span><span class="chip">1kg</span><span class="chip">2kg</span></div></div>
      <div class="f-block"><h4>Rating</h4><label class="chk"><span class="box on">{ic("check", 12)}</span>{stars(4)} &amp; up</label><label class="chk"><span class="box"></span>{stars(3)} &amp; up</label></div>
      <div class="f-block"><h4>Availability</h4><label class="toggle"><span class="sw on"><i></i></span>In stock only</label></div>
    </aside>
    <section>
      <div class="toolbar">
        <button class="btn btn-ghost btn-sm mobile-only">{ic("filter", 16)} Filters (2)</button>
        <div class="active-f desktop-only"><span class="pill">500g {ic("x", 12)}</span><span class="pill">4★ &amp; up {ic("x", 12)}</span><a class="link small">Clear all</a></div>
        <span class="muted small desktop-only">Showing 9 of 32</span>
        <div class="sort">Sort: <b>Best selling</b> {ic("down", 16)}</div>
      </div>
      <div class="p-grid g3">{cards}</div>
      <div class="pager"><span>{ic("chev", 16, "flip")}</span><span class="on">1</span><span>2</span><span>3</span><span>4</span><span>{ic("chev", 16)}</span></div>
    </section>
  </div>
</main>''' + FOOTER + "</body></html>"


def page_product():
    rel = "".join(pcard(p, True) for p in [PRODUCTS[6], PRODUCTS[3], PRODUCTS[1], PRODUCTS[7]])
    bars = "".join(f'<div class="bar-row"><span>{s}★</span><div class="bar"><i style="width:{w}%"></i></div><span class="muted">{c}</span></div>' for s, w, c in [(5, 88, 188), (4, 9, 19), (3, 2, 5), (2, 1, 1), (1, 1, 1)])
    return head("Honey Bee — Sidr Honey") + store_header("Raw Honey") + f'''
<main class="wrap">
  <nav class="crumbs">Home {ic("chev", 14)} Raw Honey {ic("chev", 14)} <b>Sidr (Beri) Honey</b></nav>
  <div class="pdp">
    <div class="gallery">
      <div class="g-main t-sidr"><span class="p-badge">Bestseller</span><div class="comb-pattern"></div>{jar("sidr", "SIDR", 300)}</div>
      <div class="thumbs"><div class="t-sidr on">{jar("sidr", "SIDR", 64)}</div><div class="t-comb">{jar("comb", "COMB", 64)}</div><div class="t-forest">{ic("image", 26)}</div><div class="t-acacia">{ic("file", 26)}<small>Lab report</small></div></div>
    </div>
    <div class="buy">
      <p class="p-origin">Karak, Khyber Pakhtunkhwa · Harvest Oct 2026</p>
      <h1 class="h1-sm">Sidr (Beri) Honey</h1>
      <div class="p-rate">{stars(4.9)} <b>4.9</b> <a class="link small">214 reviews</a> <span class="muted small">· 1,200+ sold</span></div>
      <div class="pdp-price">{rs(3200)} <s>{rs(3800)}</s> <span class="save">Save 16%</span></div>
      <p class="lead small-lead">Thick, dark amber honey from bees foraging on wild sidr (beri) blossoms. Rich, caramel-like taste with a gentle warmth. Cold-extracted and never heated.</p>
      <div class="opt"><h4>Size <span class="muted">· 500g</span></h4><div class="sizes">
        <span class="size"><b>250g</b><small>{rs(1750)}</small></span><span class="size on"><b>500g</b><small>{rs(3200)}</small></span><span class="size"><b>1kg</b><small>{rs(6000)}</small></span><span class="size off"><b>2kg</b><small>Sold out</small></span></div></div>
      <div class="stock">{ic("box", 16)} In stock — only <b>7 jars</b> left in 500g</div>
      <div class="buy-row"><div class="qty"><button>{ic("minus", 16)}</button><span>1</span><button>{ic("plus", 16)}</button></div>
        <button class="btn btn-honey btn-lg grow">{ic("bag", 18)} Add to cart · {rs(3200)}</button><button class="icon-btn bordered">{ic("heart", 20)}</button></div>
      <button class="btn btn-dark btn-lg full">Buy now</button>
      <div class="perks">
        <div>{ic("truck", 20)}<span><b>Delivery to Lahore: Thu, 30 Oct</b><br><span class="muted">Free over Rs 5,000 · otherwise Rs 250</span></span></div>
        <div>{ic("cash", 20)}<span><b>Cash on Delivery available</b><br><span class="muted">Also JazzCash, Easypaisa, cards &amp; bank transfer</span></span></div>
        <div>{ic("shield", 20)}<span><b>Lab-tested purity</b><br><span class="muted">Batch #SD-2610 · report included</span></span></div>
      </div>
    </div>
  </div>

  <div class="pdp-tabs"><span class="on">Description</span><span>Benefits &amp; use</span><span>Lab report</span><span>Shipping &amp; returns</span><span>Reviews (214)</span></div>
  <div class="pdp-info">
    <div class="desc"><h3>Wild sidr from the hills of Karak</h3>
      <p>Sidr honey is one of the most prized honeys in the world. Our beekeepers move their hives to the sidr groves of Karak each autumn, when the trees bloom for just a few weeks.</p>
      <dl class="specs"><dt>Floral source</dt><dd>Ziziphus (Sidr / Beri)</dd><dt>Texture</dt><dd>Thick, slow-pouring</dd><dt>Moisture</dt><dd>16.8% (lab tested)</dd><dt>Processing</dt><dd>Raw, cold-extracted, unfiltered</dd></dl></div>
    <div class="rev-sum"><h3>Customer reviews</h3><div class="big-rate"><b>4.9</b><div>{stars(5)}<br><span class="muted">214 verified reviews</span></div></div>{bars}
      <button class="btn btn-ghost full">Write a review</button>
      <figure class="rev mini">{stars(5)} <b>Best sidr I've found in Pakistan</b><blockquote>Thick and aromatic, exactly like the honey my grandfather brought from Karak.</blockquote><figcaption>Bilal A. · Peshawar <span class="vp">{ic("check", 14)} Verified buyer</span></figcaption></figure></div>
  </div>

  <section class="sec"><div class="sec-head"><div><span class="eyebrow">You may also like</span><h2>Pairs well with</h2></div></div><div class="p-grid">{rel}</div></section>
</main>''' + FOOTER + "</body></html>"


def page_cart():
    items = [("sidr", "SIDR", "Sidr (Beri) Honey", "500g", 3200, 2), ("kalonji", "KALONJI", "Black Seed (Kalonji) Honey", "1kg", 5600, 1), ("comb", "COMB", "Raw Honeycomb", "400g", 3600, 1)]
    rows = "".join(f'''<div class="ci"><div class="ci-img t-{k}">{jar(k, l, 72)}</div>
      <div class="ci-info"><h3>{n}</h3><p class="muted small">Size: {s} · In stock</p><div class="ci-actions"><div class="qty sm"><button>{ic("minus", 14)}</button><span>{q}</span><button>{ic("plus", 14)}</button></div><a class="link small muted">Remove</a></div></div>
      <div class="ci-price"><b>{rs(p * q)}</b>{f'<span class="muted small">{rs(p)} each</span>' if q > 1 else ""}</div></div>''' for k, l, n, s, p, q in items)
    up = "".join(pcard(p, True) for p in [PRODUCTS[1], PRODUCTS[7], PRODUCTS[4], PRODUCTS[2]])
    return head("Honey Bee — Cart") + store_header("", 4) + f'''
<main class="wrap">
  <h1 class="h1-sm page-title">Your cart <span class="muted">(4 items)</span></h1>
  <div class="ship-bar"><div>{ic("truck", 18)} You've unlocked <b>free delivery</b> 🎉</div><div class="bar"><i style="width:100%"></i></div></div>
  <div class="cart-grid">
    <section class="ci-list">{rows}<a class="link">{ic("chev", 14, "flip")} Continue shopping</a></section>
    <aside class="summary">
      <h3>Order summary</h3>
      <div class="code-row"><span class="inp grow">{ic("tag", 16)} HONEY15</span><button class="btn btn-dark btn-sm">Applied</button></div>
      <p class="ok small">{ic("check", 14)} HONEY15 — 15% off applied</p>
      <dl class="sum"><dt>Subtotal</dt><dd>{rs(15600)}</dd><dt>Discount (HONEY15)</dt><dd class="ok">− {rs(2340)}</dd><dt>Delivery</dt><dd class="ok">Free</dd></dl>
      <dl class="sum total"><dt>Total</dt><dd>{rs(13260)}</dd></dl>
      <button class="btn btn-honey btn-lg full">{ic("lock", 18)} Proceed to checkout</button>
      <div class="pay-row center"><span class="pm">COD</span><span class="pm">JazzCash</span><span class="pm">Easypaisa</span><span class="pm">Card</span></div>
    </aside>
  </div>
  <section class="sec"><div class="sec-head"><div><span class="eyebrow">Complete your order</span><h2>Customers also bought</h2></div></div><div class="p-grid">{up}</div></section>
</main>''' + FOOTER + "</body></html>"


def page_checkout():
    pays = [("cash", "Cash on Delivery", "Pay in cash when your order arrives · Rs 100 COD fee", True, ""),
            ("cash", "JazzCash", "Mobile wallet or JazzCash card", False, "JC"),
            ("cash", "Easypaisa", "Pay from your Easypaisa account", False, "EP"),
            ("lock", "Debit / Credit card", "Visa, Mastercard, UnionPay — secured by Safepay", False, "VISA"),
            ("file", "Bank transfer", "Transfer to Meezan Bank and upload your receipt", False, "")]
    payl = "".join(f'''<label class="pay {"on" if on else ""}"><span class="radio {"on" if on else ""}"></span><div><b>{t}</b><span class="muted small">{d}</span></div>{f'<span class="pm">{tag}</span>' if tag else ic(i, 22)}</label>''' for i, t, d, on, tag in pays)
    items = [("sidr", "SIDR", "Sidr (Beri) Honey", "500g × 2", 6400), ("kalonji", "KALONJI", "Black Seed Honey", "1kg × 1", 5600), ("comb", "COMB", "Raw Honeycomb", "400g × 1", 3600)]
    il = "".join(f'<div class="mini-item"><div class="ci-img sm t-{k}">{jar(k, l, 44)}<span class="q">{q[-1]}</span></div><div class="grow"><b>{n}</b><span class="muted small">{q}</span></div><b>{rs(p)}</b></div>' for k, l, n, q, p in items)
    return head("Honey Bee — Checkout") + f'''
<header class="site-header slim"><div class="wrap hrow">{LOGO}<span class="secure">{ic("lock", 16)} Secure checkout</span></div></header>
<main class="wrap">
  <ol class="steps"><li class="done"><span>{ic("check", 14)}</span>Cart</li><li class="done"><span>{ic("check", 14)}</span>Details</li><li class="on"><span>3</span>Delivery &amp; payment</li><li><span>4</span>Confirmation</li></ol>
  <div class="co-grid">
    <section class="co-main">
      <div class="card"><div class="card-h"><h3>Contact</h3><a class="link small">Edit</a></div><p>ayesha.khan@email.com · +92 321 4567890</p></div>
      <div class="card"><div class="card-h"><h3>Delivery address</h3><span class="muted small">Saved addresses ▾</span></div>
        <div class="form">
          <div class="fld"><label>Full name</label><span class="inp">Ayesha Khan</span></div>
          <div class="fld"><label>Phone</label><span class="inp">+92 321 4567890</span></div>
          <div class="fld full"><label>Address</label><span class="inp">House 24, Street 7, DHA Phase 5</span></div>
          <div class="fld"><label>City</label><span class="inp sel">Lahore {ic("down", 16)}</span></div>
          <div class="fld"><label>Province</label><span class="inp sel">Punjab {ic("down", 16)}</span></div>
        </div>
        <label class="chk"><span class="box on">{ic("check", 12)}</span>Save this address to my account</label></div>
      <div class="card"><h3>Delivery method</h3>
        <label class="pay on"><span class="radio on"></span><div><b>Standard delivery · TCS</b><span class="muted small">Arrives Thu 30 Oct – Sat 1 Nov</span></div><b class="ok">Free</b></label>
        <label class="pay"><span class="radio"></span><div><b>Express · Same/next day (Lahore)</b><span class="muted small">Order before 2 pm</span></div><b>{rs(450)}</b></label></div>
      <div class="card"><h3>Payment</h3><p class="muted small">All transactions are secure and encrypted.</p>{payl}</div>
    </section>
    <aside class="summary">
      <h3>Order summary</h3>{il}
      <dl class="sum"><dt>Subtotal</dt><dd>{rs(15600)}</dd><dt>Discount · HONEY15</dt><dd class="ok">− {rs(2340)}</dd><dt>Delivery</dt><dd class="ok">Free</dd><dt>COD fee</dt><dd>{rs(100)}</dd></dl>
      <dl class="sum total"><dt>Total</dt><dd>{rs(13360)}</dd></dl>
      <button class="btn btn-honey btn-lg full">Place order · {rs(13360)}</button>
      <p class="muted small center">By placing your order you agree to our Terms and Refund policy.</p>
    </aside>
  </div>
</main></body></html>'''


def page_account():
    orders = [("HB-10482", "26 Oct 2026", "Shipped", "ship", 13360, ["sidr", "kalonji", "comb"]),
              ("HB-10377", "02 Oct 2026", "Delivered", "ok", 6900, ["gift"]),
              ("HB-10215", "11 Sep 2026", "Delivered", "ok", 4800, ["acacia", "orange"]),
              ("HB-10088", "20 Aug 2026", "Cancelled", "bad", 2950, ["kalonji"])]
    ol = "".join(f'''<div class="orow"><div class="o-jars">{"".join(f'<div class="ci-img xs t-{j}">{jar(j, "", 30)}</div>' for j in js)}</div>
      <div class="grow"><b>{n}</b><span class="muted small">{d} · {len(js)} item{"s" if len(js) > 1 else ""}</span></div>
      <span class="status s-{c}">{s}</span><b class="desktop-only">{rs(t)}</b><a class="btn btn-ghost btn-sm">View</a></div>''' for n, d, s, c, t, js in orders)
    tl = [("Order placed", "26 Oct, 10:42 am", "done"), ("Confirmed", "26 Oct, 11:05 am", "done"), ("Packed", "27 Oct, 9:30 am", "done"),
          ("Shipped with TCS", "27 Oct, 4:15 pm · Tracking 7734 1290 552", "on"), ("Out for delivery", "Expected 30 Oct", ""), ("Delivered", "", "")]
    tll = "".join(f'<li class="{c}"><span class="dot"></span><div><b>{t}</b><span class="muted small">{d}</span></div></li>' for t, d, c in tl)
    nav = [("box", "Orders", True), ("map", "Addresses", False), ("heart", "Wishlist", False), ("user", "Profile & security", False), ("bell", "Notifications", False)]
    nl = "".join(f'<a class="{"on" if on else ""}">{ic(i, 18)} {t}</a>' for i, t, on in nav)
    return head("Honey Bee — My Account") + store_header() + f'''
<main class="wrap">
  <div class="acc-hero"><div class="avatar">AK</div><div><h1 class="h1-sm">Assalam-o-Alaikum, Ayesha</h1><p class="muted">Member since 2025 · 6 orders · Lahore</p></div></div>
  <div class="acc-grid">
    <aside class="acc-nav">{nl}<a class="muted">Sign out</a></aside>
    <section>
      <div class="card"><div class="card-h"><div><span class="eyebrow">Current order</span><h3>HB-10482 · On its way</h3></div><span class="status s-ship">Shipped</span></div>
        <div class="track-grid"><ol class="timeline">{tll}</ol>
          <div class="track-side"><div class="mini-stat"><span class="muted small">Estimated delivery</span><b>Thu, 30 October</b></div>
            <div class="mini-stat"><span class="muted small">Ship to</span><b>House 24, DHA Phase 5, Lahore</b></div>
            <div class="mini-stat"><span class="muted small">Payment</span><b>Cash on Delivery · {rs(13360)}</b></div>
            <a class="btn btn-dark btn-sm full">Track on TCS</a></div></div></div>
      <div class="card"><div class="card-h"><h3>Order history</h3><span class="muted small">Last 12 months</span></div>{ol}</div>
    </section>
  </div>
</main>''' + FOOTER + "</body></html>"


def page_admin():
    rev = [182, 164, 210, 198, 240, 226, 268, 251, 290, 312, 284, 336, 352, 330, 371, 398, 362, 410, 436, 418, 452, 470, 441, 488, 512, 496, 538, 561, 549, 584]
    W, H, P = 760, 240, 34
    mx = 640
    pts = [(P + i * (W - 2 * P) / (len(rev) - 1), H - 20 - v / mx * (H - 40)) for i, v in enumerate(rev)]
    line = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    area = line + f" L{pts[-1][0]:.1f},{H - 20} L{pts[0][0]:.1f},{H - 20} Z"
    grid = "".join(f'<line x1="0" x2="{W}" y1="{H - 20 - g / mx * (H - 40):.1f}" y2="{H - 20 - g / mx * (H - 40):.1f}" class="gl"/><text x="0" y="{H - 24 - g / mx * (H - 40):.1f}" class="ax">{g}k</text>' for g in (0, 200, 400, 600))
    xl = "".join(f'<text x="{pts[i][0]:.1f}" y="{H - 4}" class="ax" text-anchor="middle">{i + 1} Oct</text>' for i in (0, 7, 14, 21, 29))
    chart = f'<svg viewBox="0 0 {W} {H}" class="chart"><defs><linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9A21A" stop-opacity=".35"/><stop offset="1" stop-color="#E9A21A" stop-opacity="0"/></linearGradient></defs>{grid}<path d="{area}" fill="url(#ar)"/><path d="{line}" fill="none" stroke="#C97F06" stroke-width="2.5" stroke-linejoin="round"/><circle cx="{pts[-1][0]:.1f}" cy="{pts[-1][1]:.1f}" r="4.5" fill="#C97F06" stroke="#fff" stroke-width="2"/>{xl}</svg>'
    kpis = [("Revenue · Oct", "Rs 11.8M", "+18.2%", True), ("Orders", "1,284", "+12.4%", True), ("Avg. order value", "Rs 9,190", "+5.1%", True), ("Return rate", "1.3%", "−0.4 pt", True)]
    kp = "".join(f'<div class="kpi"><span class="muted small">{t}</span><b>{v}</b><span class="delta {"up" if up else "dn"}">{d} <span class="muted">vs Sep</span></span></div>' for t, v, d, up in kpis)
    st = [("Pending", 38, "#E9A21A"), ("Processing", 64, "#B86B05"), ("Shipped", 112, "#5E7A4A"), ("Delivered", 1041, "#2B1D0E"), ("Cancelled", 29, "#C2483D")]
    tot = sum(c for _, c, _ in st)
    stack = "".join(f'<i style="width:{c / tot * 100:.1f}%;background:{col}"></i>' for _, c, col in st)
    stl = "".join(f'<div class="lg"><span class="sw2" style="background:{col}"></span>{n}<b>{c}</b></div>' for n, c, col in st)
    ords = [("HB-10491", "Fatima Z.", "Karachi", "JazzCash", "Paid", 8400, "Processing", "proc"),
            ("HB-10490", "Ali H.", "Rawalpindi", "COD", "Pending", 3300, "Pending", "pend"),
            ("HB-10489", "Sana M.", "Lahore", "Card", "Paid", 12650, "Shipped", "ship"),
            ("HB-10488", "Kamran T.", "Multan", "Bank", "Verify", 6900, "Pending", "pend"),
            ("HB-10487", "Nadia R.", "Faisalabad", "Easypaisa", "Paid", 4800, "Delivered", "ok")]
    orl = "".join(f'<tr><td><b>{n}</b></td><td>{c}<span class="muted small d-block">{city}</span></td><td><span class="pm">{pm}</span></td><td><span class="pay-s p-{ps.lower()}">{ps}</span></td><td>{rs(t)}</td><td><span class="status s-{sc}">{s}</span></td></tr>' for n, c, city, pm, ps, t, s, sc in ords)
    best = [("sidr", "SIDR", "Sidr (Beri) Honey", 412, "Rs 1.32M"), ("gift", "GIFT", "Harvest Gift Box", 164, "Rs 1.13M"), ("kalonji", "KALONJI", "Black Seed Honey", 288, "Rs 0.85M"), ("acacia", "ACACIA", "Acacia Honey", 241, "Rs 0.58M")]
    bl = "".join(f'<div class="brow"><div class="ci-img xs t-{k}">{jar(k, "", 30)}</div><div class="grow"><b>{n}</b><span class="muted small">{u} units</span></div><b>{r}</b></div>' for k, l, n, u, r in best)
    low = [("Sidr Royal Reserve · 1kg", 3), ("Raw Honeycomb · 400g", 5), ("Sidr (Beri) · 500g", 7)]
    ll = "".join(f'<div class="brow"><span class="warn-dot"></span><div class="grow">{n}</div><b class="bad">{q} left</b><a class="link small">Restock</a></div>' for n, q in low)
    nav = [("grid", "Dashboard", True), ("box", "Orders", False, "38"), ("tag", "Products", False), ("leaf", "Inventory", False), ("users", "Customers", False),
           ("star", "Reviews", False, "6"), ("tag", "Discounts", False), ("image", "Banners & content", False), ("truck", "Shipping zones", False), ("chart", "Reports", False), ("cog", "Settings", False)]
    nl = "".join(f'<a class="{"on" if x[2] else ""}">{ic(x[0], 18)} {x[1]}{f"<span class=nb>{x[3]}</span>" if len(x) > 3 else ""}</a>' for x in nav)
    return head("Honey Bee — Admin") + f'''<div class="admin">
  <aside class="a-side">{LOGO}<span class="a-tag">Admin</span><nav>{nl}</nav></aside>
  <div class="a-main">
    <header class="a-top"><button class="icon-btn mobile-only">{ic("menu", 22)}</button><div class="search">{ic("search", 18)}<span>Search orders, products, customers…</span></div><div class="h-actions"><button class="icon-btn">{ic("bell", 22)}<span class="badge">3</span></button><div class="avatar sm">MA</div></div></header>
    <div class="a-body">
      <div class="a-head"><div><h1 class="h1-sm">Dashboard</h1><p class="muted">Monday, 27 October 2026 · Here's how your store is doing.</p></div>
        <div class="a-actions"><span class="inp sel">Last 30 days {ic("down", 16)}</span><button class="btn btn-honey btn-sm">{ic("plus", 16)} Add product</button></div></div>
      <div class="kpis">{kp}</div>
      <div class="a-grid">
        <div class="card"><div class="card-h"><div><h3>Revenue</h3><span class="muted small">Daily, in thousands (PKR)</span></div><div class="tabs sm"><span>7d</span><span class="on">30d</span><span>12m</span></div></div>{chart}</div>
        <div class="card"><div class="card-h"><h3>Orders by status</h3><span class="muted small">{tot:,} total</span></div><div class="stack">{stack}</div><div class="legend">{stl}</div>
          <div class="pay-split"><h4>Payment methods</h4><div class="bar-row"><span>COD</span><div class="bar"><i style="width:58%"></i></div><b>58%</b></div><div class="bar-row"><span>JazzCash</span><div class="bar"><i style="width:17%"></i></div><b>17%</b></div><div class="bar-row"><span>Easypaisa</span><div class="bar"><i style="width:12%"></i></div><b>12%</b></div><div class="bar-row"><span>Card</span><div class="bar"><i style="width:9%"></i></div><b>9%</b></div><div class="bar-row"><span>Bank</span><div class="bar"><i style="width:4%"></i></div><b>4%</b></div></div></div>
      </div>
      <div class="a-grid">
        <div class="card"><div class="card-h"><h3>Recent orders</h3><a class="link small">View all {ic("chev", 14)}</a></div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Method</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead><tbody>{orl}</tbody></table></div></div>
        <div class="stack-col"><div class="card"><div class="card-h"><h3>Best sellers</h3><span class="muted small">This month</span></div>{bl}</div>
          <div class="card"><div class="card-h"><h3>Low stock</h3><span class="status s-bad">3 alerts</span></div>{ll}</div></div>
      </div>
    </div>
  </div>
</div></body></html>'''


PAGES = {"01-home": page_home, "02-shop": page_shop, "03-product": page_product, "04-cart": page_cart,
         "05-checkout": page_checkout, "06-account": page_account, "07-admin-dashboard": page_admin}

if __name__ == "__main__":
    for name, fn in PAGES.items():
        (OUT / f"{name}.html").write_text(fn())
    print("built", len(PAGES), "pages")
