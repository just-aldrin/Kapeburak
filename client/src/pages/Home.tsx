import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coffee,
  ExternalLink,
  Instagram,
  Leaf,
  MapPin,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type Category = "All" | "Coffee" | "Pastry" | "Bottled" | "Pantry" | "Goods";
type Fulfillment = "Pickup" | "Delivery";

type Product = {
  id: string;
  name: string;
  category: Exclude<Category, "All">;
  price: number;
  description: string;
  note: string;
  image: string;
  featured?: boolean;
  options?: string[];
};

type CartLine = Product & { quantity: number; option?: string };

const generatedAssets = {
  hero: "/manus-storage/async-images/1xwVM5t7XUV3YM1nQc5SHO/image-1.webp",
  spanish: "/manus-storage/async-images/1xwVM5t7XUV3YM1nQc5SHO/image-2.webp",
  liberica: "/manus-storage/async-images/1xwVM5t7XUV3YM1nQc5SHO/image-3.webp",
  cruffin: "/manus-storage/async-images/1xwVM5t7XUV3YM1nQc5SHO/image-4.webp",
  bottle: "/manus-storage/async-images/1xwVM5t7XUV3YM1nQc5SHO/image-5.webp",
};

const products: Product[] = [
  {
    id: "spanish-latte",
    name: "Kapeburak Spanish Latte",
    category: "Coffee",
    price: 185,
    description: "Two ristretto shots, sweet condensed milk, chilled velvety fresh milk, and cinnamon.",
    note: "Our signature pour",
    image: generatedAssets.spanish,
    featured: true,
    options: ["Iced", "Hot"],
  },
  {
    id: "tultul-latte",
    name: "Guimaras Tultul Latte",
    category: "Coffee",
    price: 195,
    description: "Velvety latte layered with artisanal Guimaras tultul heirloom sea salt.",
    note: "Sweet + savory",
    image: generatedAssets.spanish,
    options: ["Iced", "Hot"],
  },
  {
    id: "liberica-cloud",
    name: "Batangas Liberica Cloud",
    category: "Coffee",
    price: 205,
    description: "Heritage Liberica espresso floated above aerated vanilla bean cloud foam.",
    note: "Bold + floral",
    image: generatedAssets.liberica,
    options: ["Iced", "Hot"],
  },
  {
    id: "ube-cruffin",
    name: "Bohol Ube Cruffin",
    category: "Pastry",
    price: 165,
    description: "27-layer laminated French butter pastry with ube halaya and three-milk cream.",
    note: "Baked this morning",
    image: generatedAssets.cruffin,
  },
  {
    id: "cold-steep",
    name: "18H Cold Steep",
    category: "Bottled",
    price: 210,
    description: "A slow-steeped cafe-grade brew with dark caramel and cacao notes.",
    note: "Keep chilled",
    image: generatedAssets.bottle,
    options: ["250ml", "500ml"],
  },
  {
    id: "atok-honey",
    name: "Atok Honeydark Beans",
    category: "Pantry",
    price: 420,
    description: "Freshly roasted Benguet beans with wild honey sweetness and a dark chocolate finish.",
    note: "250g · whole bean",
    image: generatedAssets.bottle,
    options: ["Whole bean", "Ground"],
  },
  {
    id: "field-notes-tumbler",
    name: "Field Notes Tumbler",
    category: "Goods",
    price: 780,
    description: "A double-wall thermal tumbler for slow mornings, long drives, and everything between.",
    note: "12oz · matte clay",
    image: generatedAssets.liberica,
  },
  {
    id: "panaderia-toast",
    name: "Panaderia Morning Toast",
    category: "Pastry",
    price: 145,
    description: "Griddled brioche, cultured butter, muscovado sugar, and a pinch of sea salt.",
    note: "Best with espresso",
    image: generatedAssets.cruffin,
  },
];

const categories: { label: Category; detail: string }[] = [
  { label: "All", detail: "The whole counter" },
  { label: "Coffee", detail: "Pulls + pours" },
  { label: "Pastry", detail: "Warm from the oven" },
  { label: "Bottled", detail: "For the fridge" },
  { label: "Pantry", detail: "Beans + rituals" },
  { label: "Goods", detail: "Carry the feeling" },
];

const money = (value: number) => `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

export default function Home() {
  const [category, setCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"Featured" | "Price low" | "Price high">("Featured");
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      const saved = localStorage.getItem("kapeburak-cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [checkout, setCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("Pickup");
  const [toast, setToast] = useState("");

  useEffect(() => {
    localStorage.setItem("kapeburak-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    document.body.style.overflow = cartOpen || selectedProduct !== null || checkout ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, selectedProduct, checkout]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesQuery = !normalizedQuery || [product.name, product.category, product.description, product.note].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesCategory && matchesQuery;
    });
    return [...matches].sort((left, right) => {
      if (sort === "Price low") return left.price - right.price;
      if (sort === "Price high") return right.price - left.price;
      return Number(Boolean(right.featured)) - Number(Boolean(left.featured));
    });
  }, [category, query, sort]);

  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const subtotal = cart.reduce((total, line) => total + line.price * line.quantity, 0);
  const deliveryFee = fulfillment === "Delivery" && cart.length ? 80 : 0;
  const total = subtotal + deliveryFee;

  const showToast = (message: string) => setToast(message);

  const addToCart = (product: Product, option = product.options?.[0]) => {
    setCart((current) => {
      const existing = current.find((line) => line.id === product.id && line.option === option);
      if (existing) {
        return current.map((line) => line === existing ? { ...line, quantity: line.quantity + 1 } : line);
      }
      return [...current, { ...product, option, quantity: 1 }];
    });
    setSelectedProduct(null);
    setCartOpen(true);
    showToast(`${product.name} added to your bag`);
  };

  const updateQuantity = (id: string, option: string | undefined, delta: number) => {
    setCart((current) => current.flatMap((line) => {
      if (line.id !== id || line.option !== option) return [line];
      const quantity = line.quantity + delta;
      return quantity > 0 ? [{ ...line, quantity }] : [];
    }));
  };

  const removeLine = (id: string, option: string | undefined) => {
    setCart((current) => current.filter((line) => !(line.id === id && line.option === option)));
  };

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedOption(product.options?.[0] ?? "");
  };

  const startCheckout = () => {
    if (!cart.length) return;
    setCartOpen(false);
    setCheckout(true);
  };

  const finishOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    setCart([]);
    setCheckout(false);
    setOrderNumber(`KB-${Math.floor(1000 + Math.random() * 9000)}`);
    setOrderPlaced(true);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileNavOpen(false);
  };

  return (
    <div className="site-shell">
      <div className="announcement"><Sparkles size={14} /> <span>Today’s slow notes: <strong>Atok Honeydark Muscovado</strong></span><span className="announcement-spacer" /><span>Free pickup in Iloilo on orders over ₱500</span></div>

      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="KAPEBURAK home">
          <span className="wordmark-main">KAPEBURAK</span>
          <span className="wordmark-sub">neighborhood roastery</span>
        </a>
        <button className="mobile-menu-button" onClick={() => setMobileNavOpen(!mobileNavOpen)} aria-label="Toggle navigation" aria-expanded={mobileNavOpen}>
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={`main-nav ${mobileNavOpen ? "is-open" : ""}`} aria-label="Main navigation">
          <button onClick={() => scrollTo("menu")}>Menu <ArrowDownRight size={14} /></button>
          <button onClick={() => scrollTo("story")}>Our story</button>
          <button onClick={() => scrollTo("visit")}>Visit us</button>
        </nav>
        <div className="header-actions">
          <button className="icon-button search-button" onClick={() => document.getElementById("catalog-search")?.focus()} aria-label="Search menu"><Search size={18} /></button>
          <button className="bag-button" onClick={() => setCartOpen(true)} aria-label={`Open bag with ${cartCount} items`}><ShoppingBag size={18} /><span>Bag</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
        </div>
      </header>

      <main id="top">
        <section className="hero section-pad">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> Coffee with a sense of place</p>
            <h1>Slow coffee,<br /><em>made for</em><br />everyday life.</h1>
            <p className="hero-lede">Handcrafted espresso, Philippine beans, and little rituals worth lingering over. Your comfort, your KAPEBURAK.</p>
            <div className="hero-actions"><button className="button button-dark" onClick={() => scrollTo("menu")}>Shop the menu <ArrowRight size={16} /></button><button className="text-link" onClick={() => scrollTo("story")}>Why Kapeburak <ArrowUpRight size={15} /></button></div>
            <div className="hero-asides"><div><span className="aside-number">100%</span><span>Philippine<br />origins</span></div><div><span className="aside-number">1,650m</span><span>highest farm<br />elevation</span></div><div><span className="aside-number">18h</span><span>cold<br />steep</span></div></div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-wrap"><img src={generatedAssets.hero} alt="Iced Spanish latte on a sunlit cafe table" /><div className="hero-stamp"><span>✦</span><span>slow<br />pour<br />club</span></div></div>
            <div className="hero-caption"><div><span className="caption-label">The corner in Iloilo</span><strong>Good coffee. No rush.</strong></div><span className="caption-hours">7am — 10pm<br />Mon — Sun</span></div>
          </div>
        </section>

        <div className="ticker" aria-label="KAPEBURAK values"><div className="ticker-track"><span>Local origins</span><Asterisk size={14} /><span>Freshly roasted</span><Asterisk size={14} /><span>Express pickup</span><Asterisk size={14} /><span>Iloilo delivery</span><Asterisk size={14} /><span>100% Arabica + Liberica</span><Asterisk size={14} /><span>Local origins</span><Asterisk size={14} /><span>Freshly roasted</span></div></div>

        <section className="signature section-pad">
          <div className="section-kicker"><span>01 / signature pour</span><span>Customer favorite</span></div>
          <div className="signature-card">
            <div className="signature-image"><img src={generatedAssets.spanish} alt="Kapeburak Spanish Latte" /><span className="image-tag">Most loved</span></div>
            <div className="signature-copy"><p className="eyebrow"><Coffee size={15} /> The one we’re known for</p><h2>Kapeburak<br /><em>Spanish Latte</em></h2><p>Two ristretto shots of our signature house blend over sweet condensed milk and chilled fresh milk. A dash of cinnamon makes it ours.</p><div className="signature-meta"><span>₱185.00</span><span><Star size={14} fill="currentColor" /> 4.9 · 128 pours</span></div><button className="button button-clay" onClick={() => addToCart(products[0])}>Add to bag <Plus size={16} /></button></div>
          </div>
        </section>

        <section className="catalog section-pad" id="menu">
          <div className="catalog-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> The counter</p><h2>Find your <em>everyday</em><br />favorite.</h2></div><p className="catalog-intro">Small-batch, made-to-order, and always a little bit local. Start with a pour, stay for the ritual.</p></div>
          <div className="catalog-tools"><div className="category-list" role="tablist" aria-label="Menu categories">{categories.map((item) => <button key={item.label} className={category === item.label ? "category-chip active" : "category-chip"} onClick={() => setCategory(item.label)} role="tab" aria-selected={category === item.label}>{item.label}<span>{item.detail}</span></button>)}</div><label className="search-field"><Search size={17} /><input id="catalog-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the counter" aria-label="Search the counter" />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={15} /></button>}</label></div>
          <div className="catalog-result-line"><span>{filteredProducts.length} {filteredProducts.length === 1 ? "pour" : "pours"} to explore</span><button className="sort-button" onClick={() => setSort((current) => current === "Featured" ? "Price low" : current === "Price low" ? "Price high" : "Featured")} aria-label="Cycle catalog sort">{sort} <ChevronDown size={15} /></button></div>
          {filteredProducts.length ? <div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onOpen={openProduct} onAdd={addToCart} />)}</div> : <div className="empty-results"><Coffee size={28} /><h3>No pours found.</h3><p>Try another word or browse the whole counter.</p><button className="button button-outline" onClick={() => { setQuery(""); setCategory("All"); }}>Reset the counter</button></div>}
        </section>

        <section className="ritual-section section-pad" id="story">
          <div className="ritual-visual"><div className="ritual-orbit orbit-one" /><div className="ritual-orbit orbit-two" /><div className="ritual-cup"><Coffee size={68} strokeWidth={1.1} /><span>slow<br />rituals</span></div><span className="ritual-label label-top">From the highlands</span><span className="ritual-label label-bottom">to your everyday</span></div>
          <div className="ritual-copy"><p className="eyebrow"><Leaf size={15} /> Handcrafted with pride</p><h2>A little more<br /><em>meaning</em> in every cup.</h2><p>We founded KAPEBURAK to honor the slow, proud coffee heritage of Iloilo, Bukidnon, and Batangas — translating volcanic soul and highland rituals into everyday experiences.</p><div className="origin-list"><div><span>01</span><strong>Traceable origins</strong><p>Beans with a story worth telling.</p></div><div><span>02</span><strong>Small-batch roasting</strong><p>Freshness you can taste.</p></div><div><span>03</span><strong>Made to linger</strong><p>A neighborhood, not a pit stop.</p></div></div><button className="text-link" onClick={() => scrollTo("visit")}>Meet us at the corner <ArrowUpRight size={15} /></button></div>
        </section>

        <section className="split-callouts section-pad"><button className="callout-card callout-bottles" onClick={() => { setCategory("Bottled"); scrollTo("menu"); }}><div><p className="eyebrow">For the fridge</p><h3>Keep cafe-grade<br /><em>brews</em> at home.</h3><span className="text-link">Shop bottled <ArrowRight size={15} /></span></div><img src={generatedAssets.bottle} alt="Bottled cold brew concentrate" /></button><button className="callout-card callout-goods" onClick={() => { setCategory("Goods"); scrollTo("menu"); }}><div><p className="eyebrow">For the ritual</p><h3>Carry a little<br /><em>comfort.</em></h3><span className="text-link">View collection <ArrowRight size={15} /></span></div><div className="goods-graphic"><ShoppingBag size={64} strokeWidth={1} /><span>KB</span></div></button></section>

        <section className="visit section-pad" id="visit"><div className="visit-card"><div className="visit-copy"><p className="eyebrow"><MapPin size={15} /> Your neighborhood sanctuary</p><h2>Come as you are.<br /><em>Stay awhile.</em></h2><p>Step in for an unhurried morning pour-over, quiet workspace seating, and high-speed Wi-Fi. We’re happy to serve coffee with comfort.</p><div className="address"><strong>College of Management (CM) Bldg.</strong><span>University of the Philippines Visayas</span><span>MHW4+W24, Iloilo City, Iloilo</span></div><div className="visit-actions"><button className="button button-dark" onClick={() => window.open("https://maps.google.com/?q=University+of+the+Philippines+Visayas+College+of+Management", "_blank")}>Get directions <ExternalLink size={15} /></button><a className="text-link" href="https://instagram.com" target="_blank" rel="noreferrer">@kapeburak <Instagram size={15} /></a></div></div><div className="hours-card"><span className="hours-label">Open daily</span><strong>7:00 AM<br /><em>—</em> 10:00 PM</strong><span className="hours-note"><Clock3 size={14} /> Walk-ins welcome</span><div className="hours-mark">✦</div></div></div></section>
      </main>

      <footer className="site-footer"><div className="footer-brand"><span className="wordmark-main">KAPEBURAK</span><span>Philippine coffee, everyday.</span></div><div className="footer-links"><a href="#menu">Menu</a><a href="#story">Our story</a><a href="#visit">Visit</a><a href="mailto:hello@kapeburak.com">Say hello</a></div><div className="footer-legal">© 2026 KAPEBURAK<br />Made slowly in Iloilo City</div></footer>

      {toast && <div className="toast" role="status"><Check size={16} /> {toast}</div>}
      {mobileNavOpen && <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)} />}

      {selectedProduct && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedProduct(null); }}><div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-title"><button className="modal-close" onClick={() => setSelectedProduct(null)} aria-label="Close product details"><X size={20} /></button><div className="modal-image"><img src={selectedProduct.image} alt={selectedProduct.name} /></div><div className="modal-copy"><p className="eyebrow">{selectedProduct.category} · {selectedProduct.note}</p><h2 id="product-title">{selectedProduct.name}</h2><p>{selectedProduct.description}</p><div className="modal-price">{money(selectedProduct.price)}</div>{selectedProduct.options && <div className="option-picker"><span>Choose your pour</span><div>{selectedProduct.options.map((option) => <button key={option} className={selectedOption === option ? "option active" : "option"} onClick={() => setSelectedOption(option)}>{option}</button>)}</div></div>}<button className="button button-dark full-button" onClick={() => addToCart(selectedProduct, selectedOption || undefined)}>Add to bag <Plus size={17} /></button><span className="modal-note"><Truck size={14} /> Ready in 18 minutes for express pickup</span></div></div></div>}

      {cartOpen && <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}><aside className="cart-drawer" aria-label="Shopping bag"><div className="drawer-header"><div><p className="eyebrow">Your bag</p><h2>{cartCount ? `${cartCount} ${cartCount === 1 ? "item" : "items"}` : "A quiet little bag"}</h2></div><button className="modal-close" onClick={() => setCartOpen(false)} aria-label="Close shopping bag"><X size={20} /></button></div>{cart.length ? <><div className="fulfillment-toggle"><button className={fulfillment === "Pickup" ? "active" : ""} onClick={() => setFulfillment("Pickup")}><Coffee size={15} /> Express pickup</button><button className={fulfillment === "Delivery" ? "active" : ""} onClick={() => setFulfillment("Delivery")}><Truck size={15} /> Iloilo delivery</button></div><div className="cart-lines">{cart.map((line) => <div className="cart-line" key={`${line.id}-${line.option}`}><img src={line.image} alt="" /><div className="cart-line-copy"><strong>{line.name}</strong><span>{line.option || line.note}</span><div className="line-bottom"><span>{money(line.price * line.quantity)}</span><div className="quantity"><button onClick={() => updateQuantity(line.id, line.option, -1)} aria-label={`Decrease ${line.name}`}><Minus size={13} /></button><span>{line.quantity}</span><button onClick={() => updateQuantity(line.id, line.option, 1)} aria-label={`Increase ${line.name}`}><Plus size={13} /></button></div></div></div><button className="remove-line" onClick={() => removeLine(line.id, line.option)} aria-label={`Remove ${line.name}`}><X size={15} /></button></div>)}</div><div className="drawer-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>{deliveryFee > 0 && <div><span>Delivery</span><strong>{money(deliveryFee)}</strong></div>}<div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div><button className="button button-dark full-button" onClick={startCheckout}>Continue to checkout <ArrowRight size={16} /></button><span className="drawer-footnote">{fulfillment === "Pickup" ? "Ready in 18 minutes at the Iloilo corner." : "Chilled direct courier within Iloilo City."}</span></div></> : <div className="empty-bag"><div className="empty-bag-icon"><ShoppingBag size={28} /></div><h3>Nothing here yet.</h3><p>Take a look at today’s pours and bring a little comfort home.</p><button className="button button-dark" onClick={() => { setCartOpen(false); scrollTo("menu"); }}>Browse the menu <ArrowRight size={16} /></button></div>}</aside></div>}

      {checkout && <div className="modal-backdrop"><div className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><div className="checkout-header"><div><p className="eyebrow">Almost there</p><h2 id="checkout-title">Make it yours.</h2></div><button className="modal-close" onClick={() => setCheckout(false)} aria-label="Close checkout"><X size={20} /></button></div><form onSubmit={finishOrder} className="checkout-form"><div className="checkout-grid"><label>Full name<input name="name" required placeholder="Your name" /></label><label>Email address<input name="email" type="email" required placeholder="you@email.com" /></label></div><div className="checkout-grid"><label>Phone number<input name="phone" required placeholder="09XX XXX XXXX" /></label><label>Fulfillment<select name="fulfillment" value={fulfillment} onChange={(event) => setFulfillment(event.target.value as Fulfillment)}><option>Pickup</option><option>Delivery</option></select></label></div>{fulfillment === "Delivery" && <label>Delivery address<input name="address" required placeholder="Street, barangay, Iloilo City" /></label>}<label>Order note <span className="optional">optional</span><textarea name="note" rows={2} placeholder="Anything we should know?" /></label><div className="checkout-review"><div><span>{cartCount} {cartCount === 1 ? "item" : "items"}</span><strong>{money(total)}</strong></div><span>{fulfillment === "Pickup" ? "Express pickup · 18 min" : "Iloilo delivery · ₱80"}</span></div><button className="button button-dark full-button" type="submit">Place order <ArrowRight size={16} /></button><p className="secure-note">This demo checkout confirms your order request. Payment is completed at the café or upon delivery.</p></form></div></div>}

      {orderPlaced && <div className="modal-backdrop"><div className="confirmation-card" role="dialog" aria-modal="true"><div className="confirmation-mark"><Check size={28} /></div><p className="eyebrow">Order received</p><h2>See you at the<br /><em>corner.</em></h2><p>Your KAPEBURAK order is in the queue. We’ll have it ready in about 18 minutes.</p><strong className="order-number">{orderNumber}</strong><button className="button button-dark full-button" onClick={() => setOrderPlaced(false)}>Back to the menu <ArrowRight size={16} /></button></div></div>}
    </div>
  );
}

function ProductCard({ product, onOpen, onAdd }: { product: Product; onOpen: (product: Product) => void; onAdd: (product: Product) => void }) {
  return <article className="product-card"><button className="product-image-button" onClick={() => onOpen(product)} aria-label={`View ${product.name}`}><div className="product-image"><img src={product.image} alt="" />{product.featured && <span className="image-tag">Popular</span>}<span className="quick-add">View <ArrowUpRight size={15} /></span></div></button><div className="product-card-info"><div><span className="product-category">{product.category} · {product.note}</span><h3>{product.name}</h3></div><div className="product-buy"><strong>{money(product.price)}</strong><button onClick={() => onAdd(product)} aria-label={`Add ${product.name} to bag`}><Plus size={17} /></button></div></div></article>;
}
