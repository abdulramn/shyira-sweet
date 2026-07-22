import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
} from "../lib/siteSettings";

type InquiryStatus = "new" | "contacted" | "completed";

type Inquiry = {
  id: string;
  name: string;
  contact: string;
  message: string;
  status: string;
  created_at: string;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: string;
  unit: string;
  image_url: string;
  alt_text: string;
  tag: string | null;
  active: boolean;
  sort_order: number;
};

type ProductDraft = {
  name: string;
  description: string;
  price: string;
  unit: string;
  image_url: string;
  alt_text: string;
  tag: string;
  active: boolean;
  sort_order: number;
};

const EMPTY_PRODUCT: ProductDraft = {
  name: "",
  description: "",
  price: "",
  unit: "",
  image_url: "",
  alt_text: "",
  tag: "",
  active: true,
  sort_order: 100,
};

const normalizeStatus = (status: string): InquiryStatus => {
  const value = status.toLowerCase();
  if (value === "contacted") return "contacted";
  if (value === "completed") return "completed";
  return "new";
};

type PortfolioItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_visible: boolean;
};

type Tab = "inquiries" | "products" | "portfolio" | "settings";

export default function AdminDashboard() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setCheckingAuth(false);
      return;
    }

    let active = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session?.user) {
        setAuthorized(false);
        setCheckingAuth(false);
        return;
      }
      await verifyAdmin(data.session.user.id);
    };

    const verifyAdmin = async (userId: string) => {
      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!active) return;
      if (error || !data) {
        setAuthorized(false);
        setAuthError("This account is not authorized as an owner/admin.");
      } else {
        setAuthorized(true);
        setAuthError("");
      }
      setCheckingAuth(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setAuthorized(false);
        setCheckingAuth(false);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured) return <SetupRequired />;
  if (checkingAuth) return <LoadingScreen label="Checking secure access…" />;
  if (!authorized) return <LoginScreen externalError={authError} />;

  return <Dashboard />;
}

function SetupRequired() {
  return (
    <div className="min-h-screen bg-[#285c50] px-5 py-16 text-[#f3ddc7]">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e8b64a]">Admin Setup</p>
        <h1 className="mt-3 font-display text-3xl font-bold">Connect Supabase first</h1>
        <p className="mt-4 leading-7 text-[#f3ddc7]/80">
          The secure dashboard is installed, but the site is missing its Supabase environment variables.
          Follow the included <strong>README_ADMIN_SETUP_AR.md</strong> file, then redeploy on Netlify.
        </p>
        <a href="/" className="mt-7 inline-block rounded-full border border-white/30 px-5 py-2 text-sm font-bold hover:bg-white/10">
          ← Back to Website
        </a>
      </div>
    </div>
  );
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#285c50] text-[#f3ddc7]">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[#e8b64a]" />
        <p className="mt-4 text-sm">{label}</p>
      </div>
    </div>
  );
}

function LoginScreen({ externalError }: { externalError?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(externalError || "");
  const [sending, setSending] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSending(true);
    setError("");

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError || !data.user) {
      setError(loginError?.message || "Could not sign in.");
      setSending(false);
      return;
    }

    const { data: admin } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (!admin) {
      await supabase.auth.signOut();
      setError("This account is not authorized as an owner/admin.");
      setSending(false);
      return;
    }

    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#285c50] px-5 py-16 text-[#f3ddc7]">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur">
        <img src="/images/logo.png" alt="SHYIRA Sweet" className="mx-auto h-20 w-20 rounded-full border border-[#e8b64a]/40 object-cover" />
        <h1 className="mt-5 text-center font-display text-3xl font-bold">Owner Login</h1>
        <p className="mt-2 text-center text-sm text-[#f3ddc7]/65">SHYIRA Sweet secure dashboard</p>

        <form onSubmit={login} className="mt-7 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            required
            className="ss-input"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            className="ss-input"
          />
          {error && <p className="rounded-xl bg-red-950/35 p-3 text-sm text-red-100">{error}</p>}
          <button disabled={sending} className="w-full rounded-full bg-[#f3ddc7] px-5 py-3 font-bold text-[#285c50] disabled:opacity-60">
            {sending ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <a href="/" className="mt-6 block text-center text-sm text-[#f3ddc7]/70 underline">← Back to website</a>
      </div>
    </div>
  );
}

function Dashboard() {
  const [tab, setTab] = useState<Tab>("inquiries");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productModal, setProductModal] = useState<Product | "new" | null>(null);
  const [portfolioModal, setPortfolioModal] = useState<PortfolioItem | "new" | null>(null);

  const loadAll = async () => {
    if (!supabase) return;
    setLoading(true);
    setError("");

    const [inquiriesResult, productsResult, portfolioResult, settingsResult] = await Promise.all([
      supabase.from("inquiries").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("sort_order", { ascending: true }),
      supabase.from("portfolio_items").select("*").order("sort_order", { ascending: true }),
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    ]);

    if (inquiriesResult.error) setError(inquiriesResult.error.message);
    else setInquiries((inquiriesResult.data || []) as Inquiry[]);

    if (productsResult.error) setError((prev) => prev || productsResult.error!.message);
    else setProducts((productsResult.data || []) as Product[]);

    if (portfolioResult.error) setError((prev) => prev || portfolioResult.error!.message);
    else setPortfolio((portfolioResult.data || []) as PortfolioItem[]);

    if (settingsResult.data) setSettings({ ...DEFAULT_SITE_SETTINGS, ...settingsResult.data } as SiteSettings);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const counts = useMemo(
    () => ({
      New: inquiries.filter((i) => normalizeStatus(i.status) === "new").length,
      Contacted: inquiries.filter((i) => normalizeStatus(i.status) === "contacted").length,
      Completed: inquiries.filter((i) => normalizeStatus(i.status) === "completed").length,
      LiveProducts: products.filter((p) => p.active).length,
    }),
    [inquiries, products]
  );

  const logout = async () => {
    await supabase?.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#285c50] text-[#f3ddc7]">
      <header className="border-b border-white/10 bg-black/10 px-5 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/images/logo.png" alt="SHYIRA Sweet" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <h1 className="font-display text-2xl font-bold">SHYIRA Sweet</h1>
              <p className="text-xs text-[#f3ddc7]/60">Secure Owner Dashboard</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={loadAll} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">Refresh</button>
            <a href="/" className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">View Website</a>
            <button onClick={logout} className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/15">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="New Inquiries" value={counts.New} />
          <StatCard label="Contacted" value={counts.Contacted} />
          <StatCard label="Completed" value={counts.Completed} />
          <StatCard label="Live Products" value={counts.LiveProducts} />
        </div>

        <nav className="mt-8 flex flex-wrap gap-2 rounded-2xl bg-white/5 p-2">
          <TabButton active={tab === "inquiries"} onClick={() => setTab("inquiries")}>Inquiries</TabButton>
          <TabButton active={tab === "products"} onClick={() => setTab("products")}>Products</TabButton>
          <TabButton active={tab === "portfolio"} onClick={() => setTab("portfolio")}>Gallery / Work</TabButton>
          <TabButton active={tab === "settings"} onClick={() => setTab("settings")}>Settings</TabButton>
        </nav>

        {error && <div className="mt-5 rounded-xl bg-red-950/30 p-4 text-sm text-red-100">{error}</div>}

        {loading ? (
          <div className="py-20 text-center text-[#f3ddc7]/60">Loading dashboard…</div>
        ) : (
          <div className="mt-6">
            {tab === "inquiries" && <InquiriesPanel inquiries={inquiries} onChanged={loadAll} />}
            {tab === "products" && (
              <ProductsPanel
                products={products}
                onAdd={() => setProductModal("new")}
                onEdit={(product) => setProductModal(product)}
                onChanged={loadAll}
              />
            )}
            {tab === "portfolio" && (
              <PortfolioPanel
                items={portfolio}
                onAdd={() => setPortfolioModal("new")}
                onEdit={(item) => setPortfolioModal(item)}
                onChanged={loadAll}
              />
            )}
            {tab === "settings" && <SettingsPanel settings={settings} setSettings={setSettings} />}
          </div>
        )}
      </main>

      {productModal && (
        <ProductModal
          product={productModal === "new" ? null : productModal}
          onClose={() => setProductModal(null)}
          onSaved={async () => {
            setProductModal(null);
            await loadAll();
          }}
        />
      )}

      {portfolioModal && (
        <PortfolioModal
          item={portfolioModal === "new" ? null : portfolioModal}
          onClose={() => setPortfolioModal(null)}
          onSaved={async () => {
            setPortfolioModal(null);
            await loadAll();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
      <p className="text-sm text-[#f3ddc7]/65">{label}</p>
      <p className="mt-2 font-display text-4xl font-bold">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${active ? "bg-[#f3ddc7] text-[#285c50]" : "text-[#f3ddc7]/75 hover:bg-white/10"}`}
    >
      {children}
    </button>
  );
}

function InquiriesPanel({ inquiries, onChanged }: { inquiries: Inquiry[]; onChanged: () => Promise<void> }) {
  const [filter, setFilter] = useState<"all" | InquiryStatus>("all");
  const visible = filter === "all" ? inquiries : inquiries.filter((i) => normalizeStatus(i.status) === filter);

  const updateStatus = async (id: string, status: InquiryStatus) => {
    if (!supabase) return;
    const { error } = await supabase.from("inquiries").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) alert(error.message);
    else await onChanged();
  };

  const remove = async (id: string) => {
    if (!supabase || !confirm("Delete this inquiry permanently?")) return;
    const { error } = await supabase.from("inquiries").delete().eq("id", id);
    if (error) alert(error.message);
    else await onChanged();
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Website Inquiries</h2>
          <p className="mt-1 text-sm text-[#f3ddc7]/60">Contact requests submitted through the website. This is not an order system.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as "all" | InquiryStatus)} className="rounded-xl border border-white/20 bg-[#285c50] px-4 py-2 text-sm">
          <option value="all">All</option><option value="new">New</option><option value="contacted">Contacted</option><option value="completed">Completed</option>
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {visible.length === 0 && <p className="rounded-2xl bg-white/5 p-8 text-center text-[#f3ddc7]/55">No inquiries here yet.</p>}
        {visible.map((item) => {
          const normalized = normalizeStatus(item.status);
          return (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-black/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">{item.name}</h3>
                  <p className="mt-1 text-sm text-[#e8b64a]">{item.contact}</p>
                  <p className="mt-1 text-xs text-[#f3ddc7]/45">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={normalized}
                    onChange={(e) => updateStatus(item.id, e.target.value as InquiryStatus)}
                    className="rounded-lg border border-white/20 bg-[#285c50] px-3 py-2 text-sm"
                  >
                    <option value="new">New</option><option value="contacted">Contacted</option><option value="completed">Completed</option>
                  </select>
                  <button onClick={() => remove(item.id)} className="rounded-lg px-3 py-2 text-sm text-red-200 hover:bg-red-950/30">Delete</button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap rounded-xl bg-white/5 p-4 text-sm leading-6 text-[#f3ddc7]/85">{item.message}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ProductsPanel({ products, onAdd, onEdit, onChanged }: { products: Product[]; onAdd: () => void; onEdit: (product: Product) => void; onChanged: () => Promise<void> }) {
  const remove = async (product: Product) => {
    if (!supabase || !confirm(`Delete ${product.name}? This removes it from the public menu.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) alert(error.message);
    else await onChanged();
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Manage Products</h2>
          <p className="mt-1 text-sm text-[#f3ddc7]/60">Add products, edit prices and descriptions, upload product photos, or hide items from the public menu.</p>
        </div>
        <button onClick={onAdd} className="rounded-full bg-[#f3ddc7] px-5 py-2.5 text-sm font-bold text-[#285c50]">+ Add Product</button>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article key={product.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/10">
            <img src={product.image_url} alt={product.alt_text || product.name} className="aspect-[4/3] w-full object-cover" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{product.name}</h3>
                  <p className="text-sm text-[#e8b64a]">{product.price} · {product.unit}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${product.active ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/50"}`}>{product.active ? "LIVE" : "HIDDEN"}</span>
              </div>
              {product.description && <p className="mt-3 line-clamp-3 text-sm text-[#f3ddc7]/65">{product.description}</p>}
              <div className="mt-4 flex gap-2">
                <button onClick={() => onEdit(product)} className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/15">Edit</button>
                <button onClick={() => remove(product)} className="rounded-lg px-3 py-2 text-sm text-red-200 hover:bg-red-950/30">Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductModal({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<ProductDraft>(product ? {
    name: product.name,
    description: product.description,
    price: product.price,
    unit: product.unit,
    image_url: product.image_url,
    alt_text: product.alt_text,
    tag: product.tag || "",
    active: product.active,
    sort_order: product.sort_order,
  } : EMPTY_PRODUCT);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setError("");

    let imageUrl = form.image_url.trim();

    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        return;
      }
      imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    }

    if (!imageUrl) {
      setError("Please upload an image or enter an image URL.");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price.trim(),
      unit: form.unit.trim(),
      image_url: imageUrl,
      alt_text: form.alt_text.trim(),
      tag: form.tag.trim() || null,
      active: form.active,
      sort_order: Number(form.sort_order),
      updated_at: new Date().toISOString(),
    };

    const result = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert(payload);

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    await onSaved();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#285c50] p-7 text-[#f3ddc7] shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-display text-2xl font-bold">{product ? "Edit Product" : "Add Product"}</h3>
          <button onClick={onClose} className="text-2xl text-white/60">×</button>
        </div>
        <form onSubmit={save} className="mt-6 space-y-4">
          <input className="ss-input" placeholder="Product name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <textarea className="ss-input min-h-28" placeholder="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="ss-input" placeholder="Price, e.g. $50 / $25" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <input className="ss-input" placeholder="Unit, e.g. Large / Small" required value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="ss-input" placeholder="Tag (optional)" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />
            <input className="ss-input" type="number" placeholder="Sort order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          </div>
          <input className="ss-input" placeholder="Image alt text" value={form.alt_text} onChange={(e) => setForm({ ...form, alt_text: e.target.value })} />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#f3ddc7]/60">Upload Product Image</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-2 block w-full text-sm" />
            <p className="my-3 text-center text-xs text-white/40">OR</p>
            <input className="ss-input" placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          </div>
          <label className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Show this product on the public menu
          </label>
          {error && <p className="rounded-xl bg-red-950/35 p-3 text-sm text-red-100">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-white/25 py-3">Cancel</button>
            <button disabled={saving} className="flex-1 rounded-full bg-[#f3ddc7] py-3 font-bold text-[#285c50] disabled:opacity-60">{saving ? "Saving…" : "Save Product"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PortfolioPanel({ items, onAdd, onEdit, onChanged }: { items: PortfolioItem[]; onAdd: () => void; onEdit: (item: PortfolioItem) => void; onChanged: () => Promise<void> }) {
  const remove = async (id: string) => {
    if (!supabase || !confirm("Delete this portfolio item?")) return;
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (error) alert(error.message);
    else await onChanged();
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Portfolio / Work Gallery</h2>
          <p className="mt-1 text-sm text-[#f3ddc7]/60">Add, edit, hide, or remove work shown in the public gallery.</p>
        </div>
        <button onClick={onAdd} className="rounded-full bg-[#f3ddc7] px-5 py-2.5 text-sm font-bold text-[#285c50]">+ Add Work</button>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-black/10">
            <img src={item.image_url} alt={item.title} className="aspect-[4/3] w-full object-cover" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-xs text-[#e8b64a]">{item.category}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.is_visible ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/50"}`}>{item.is_visible ? "VISIBLE" : "HIDDEN"}</span>
              </div>
              {item.description && <p className="mt-3 line-clamp-2 text-sm text-[#f3ddc7]/65">{item.description}</p>}
              <div className="mt-4 flex gap-2">
                <button onClick={() => onEdit(item)} className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/15">Edit</button>
                <button onClick={() => remove(item.id)} className="rounded-lg px-3 py-2 text-sm text-red-200 hover:bg-red-950/30">Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PortfolioModal({ item, onClose, onSaved }: { item: PortfolioItem | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({
    title: item?.title || "",
    category: item?.category || "Work",
    description: item?.description || "",
    image_url: item?.image_url || "",
    sort_order: item?.sort_order ?? 0,
    is_visible: item?.is_visible ?? true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setError("");

    let imageUrl = form.image_url.trim();

    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("portfolio").upload(path, file, { upsert: false });
      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        return;
      }
      imageUrl = supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
    }

    if (!imageUrl) {
      setError("Please upload an image or enter an image URL.");
      setSaving(false);
      return;
    }

    const payload = { ...form, image_url: imageUrl, sort_order: Number(form.sort_order), updated_at: new Date().toISOString() };
    const result = item
      ? await supabase.from("portfolio_items").update(payload).eq("id", item.id)
      : await supabase.from("portfolio_items").insert(payload);

    if (result.error) {
      setError(result.error.message);
      setSaving(false);
      return;
    }

    await onSaved();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-[#285c50] p-7 text-[#f3ddc7] shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-display text-2xl font-bold">{item ? "Edit Work" : "Add Work"}</h3>
          <button onClick={onClose} className="text-2xl text-white/60">×</button>
        </div>
        <form onSubmit={save} className="mt-6 space-y-4">
          <input className="ss-input" placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="ss-input" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <textarea className="ss-input min-h-24" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#f3ddc7]/60">Upload Image</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm" />
          </div>
          <div className="text-center text-xs text-white/40">OR</div>
          <input className="ss-input" placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <input className="ss-input" type="number" placeholder="Sort order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
          <label className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-sm">
            <input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} />
            Visible on public website
          </label>
          {error && <p className="rounded-xl bg-red-950/35 p-3 text-sm text-red-100">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-white/25 py-3">Cancel</button>
            <button disabled={saving} className="flex-1 rounded-full bg-[#f3ddc7] py-3 font-bold text-[#285c50] disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SettingsPanel({ settings, setSettings }: { settings: SiteSettings; setSettings: (s: SiteSettings) => void }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setMessage("");
    const { error } = await supabase
      .from("site_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSaving(false);
    setMessage(error ? error.message : "Settings saved. Refresh the public website to see the changes.");
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
      <div>
        <h2 className="font-display text-2xl font-bold">Website Settings</h2>
        <p className="mt-1 text-sm text-[#f3ddc7]/60">Update contact links and footer text without editing GitHub code.</p>
      </div>

      <form onSubmit={save} className="mt-6 grid gap-5 md:grid-cols-2">
        <SettingField label="Phone display"><input className="ss-input" value={settings.phone_display} onChange={(e) => setSettings({ ...settings, phone_display: e.target.value })} /></SettingField>
        <SettingField label="Phone link (digits only)"><input className="ss-input" value={settings.phone_link} onChange={(e) => setSettings({ ...settings, phone_link: e.target.value })} /></SettingField>
        <SettingField label="WhatsApp number (digits only)"><input className="ss-input" value={settings.whatsapp_link} onChange={(e) => setSettings({ ...settings, whatsapp_link: e.target.value })} /></SettingField>
        <SettingField label="City"><input className="ss-input" value={settings.city} onChange={(e) => setSettings({ ...settings, city: e.target.value })} /></SettingField>
        <SettingField label="Instagram URL"><input className="ss-input" value={settings.instagram_url} onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })} /></SettingField>
        <SettingField label="Instagram handle"><input className="ss-input" value={settings.instagram_handle} onChange={(e) => setSettings({ ...settings, instagram_handle: e.target.value })} /></SettingField>
        <SettingField label="Facebook URL"><input className="ss-input" value={settings.facebook_url} onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })} /></SettingField>
        <SettingField label="Footer tagline"><input className="ss-input" value={settings.footer_tagline} onChange={(e) => setSettings({ ...settings, footer_tagline: e.target.value })} /></SettingField>
        <div className="md:col-span-2">
          <SettingField label="Copyright / rights text">
            <input className="ss-input" value={settings.footer_rights_text} onChange={(e) => setSettings({ ...settings, footer_rights_text: e.target.value })} />
          </SettingField>
          <p className="mt-2 text-xs text-[#f3ddc7]/45">The year is automatic. Example output: © {new Date().getFullYear()} {settings.footer_rights_text}</p>
        </div>
        {message && <p className="md:col-span-2 rounded-xl bg-white/10 p-3 text-sm">{message}</p>}
        <button disabled={saving} className="md:col-span-2 rounded-full bg-[#f3ddc7] px-6 py-3 font-bold text-[#285c50] disabled:opacity-60">{saving ? "Saving…" : "Save Website Settings"}</button>
      </form>
    </section>
  );
}

function SettingField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#f3ddc7]/55">{label}</span>{children}</label>;
}
