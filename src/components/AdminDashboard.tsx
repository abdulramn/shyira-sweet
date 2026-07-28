import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  isSupabaseConfigured,
  supabase,
} from "../lib/supabase";

import {
  DEFAULT_SITE_SETTINGS,
  type SiteSettings,
} from "../lib/siteSettings";

type InquiryStatus =
  | "new"
  | "contacted"
  | "completed";

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

type PortfolioItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_visible: boolean;
};

type AdminIdentity = {
  id: string;
  email: string;
  fullName: string;
  role: "owner" | "admin";
  canManageUsers: boolean;
};

type AdminAccount = {
  id: string;
  fullName: string;
  email: string;
  role: "owner" | "admin";
  active: boolean;
  isOwner: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmed: boolean;
};

type Tab =
  | "inquiries"
  | "products"
  | "portfolio"
  | "settings"
  | "users";

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

const normalizeStatus = (
  status: string
): InquiryStatus => {
  const value = status.toLowerCase();

  if (value === "contacted") {
    return "contacted";
  }

  if (value === "completed") {
    return "completed";
  }

  return "new";
};

async function getAccessToken(): Promise<string> {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured."
    );
  }

  const {
    data,
    error,
  } = await supabase.auth.getSession();

  if (
    error ||
    !data.session?.access_token
  ) {
    throw new Error(
      "Your session expired. Sign in again."
    );
  }

  return data.session.access_token;
}

async function adminRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();

  const headers = new Headers(
    options.headers
  );

  headers.set(
    "Authorization",
    `Bearer ${token}`
  );

  if (
    options.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const result = (await response
    .json()
    .catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!response.ok) {
    throw new Error(
      result.error ||
        `Server error (${response.status})`
    );
  }

  return result;
}

export default function AdminDashboard() {
  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [authorized, setAuthorized] =
    useState(false);

  const [authError, setAuthError] =
    useState("");

  useEffect(() => {
    if (!supabase) {
      setCheckingAuth(false);
      return;
    }

    let active = true;

    const verifyAdmin = async (
      userId: string
    ) => {
      const {
        data,
        error,
      } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (error || !data) {
        setAuthorized(false);
        setAuthError(
          "This account is not authorized as an owner/admin."
        );
      } else {
        setAuthorized(true);
        setAuthError("");
      }

      setCheckingAuth(false);
    };

    const checkSession = async () => {
      const { data } =
        await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (!data.session?.user) {
        setAuthorized(false);
        setCheckingAuth(false);
        return;
      }

      await verifyAdmin(
        data.session.user.id
      );
    };

    void checkSession();

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!session?.user) {
            setAuthorized(false);
            setCheckingAuth(false);
          }
        }
      );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured) {
    return <SetupRequired />;
  }

  if (checkingAuth) {
    return (
      <LoadingScreen label="Checking secure access…" />
    );
  }

  if (!authorized) {
    return (
      <LoginScreen
        externalError={authError}
      />
    );
  }

  return <Dashboard />;
}

function SetupRequired() {
  return (
    <div className="min-h-screen bg-[#285c50] px-5 py-16 text-[#f3ddc7]">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e8b64a]">
          Admin Setup
        </p>

        <h1 className="mt-3 font-display text-3xl font-bold">
          Connect Supabase first
        </h1>

        <p className="mt-4 leading-7 text-[#f3ddc7]/80">
          The secure dashboard is installed,
          but the site is missing its Supabase
          environment variables. Add the
          required variables in Cloudflare and
          redeploy the Worker.
        </p>

        <a
          href="/"
          className="mt-7 inline-block rounded-full border border-white/30 px-5 py-2 text-sm font-bold hover:bg-white/10"
        >
          ← Back to Website
        </a>
      </div>
    </div>
  );
}

function LoadingScreen({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#285c50] text-[#f3ddc7]">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[#e8b64a]" />

        <p className="mt-4 text-sm">
          {label}
        </p>
      </div>
    </div>
  );
}

function LoginScreen({
  externalError,
}: {
  externalError?: string;
}) {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState(externalError || "");

  const [sending, setSending] =
    useState(false);

  const login = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    setSending(true);
    setError("");

    const {
      data,
      error: loginError,
    } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (
      loginError ||
      !data.user
    ) {
      setError(
        loginError?.message ||
          "Could not sign in."
      );

      setSending(false);
      return;
    }

    const { data: admin } =
      await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

    if (!admin) {
      await supabase.auth.signOut();

      setError(
        "This account is not authorized as an owner/admin."
      );

      setSending(false);
      return;
    }

    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#285c50] px-5 py-16 text-[#f3ddc7]">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur">
        <img
          src="/images/logo.png"
          alt="SHYIRA Sweet"
          className="mx-auto h-20 w-20 rounded-full border border-[#e8b64a]/40 object-cover"
        />

        <h1 className="mt-5 text-center font-display text-3xl font-bold">
          Admin Login
        </h1>

        <p className="mt-2 text-center text-sm text-[#f3ddc7]/65">
          SHYIRA Sweet secure dashboard
        </p>

        <form
          onSubmit={login}
          className="mt-7 space-y-4"
        >
          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Email"
            autoComplete="email"
            required
            className="ss-input"
          />

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="Password"
            autoComplete="current-password"
            required
            className="ss-input"
          />

          {error && (
            <p className="rounded-xl bg-red-950/35 p-3 text-sm text-red-100">
              {error}
            </p>
          )}

          <button
            disabled={sending}
            className="w-full rounded-full bg-[#f3ddc7] px-5 py-3 font-bold text-[#285c50] disabled:opacity-60"
          >
            {sending
              ? "Signing in…"
              : "Sign In"}
          </button>
        </form>

        <a
          href="/"
          className="mt-6 block text-center text-sm text-[#f3ddc7]/70 underline"
        >
          ← Back to website
        </a>
      </div>
    </div>
  );
}

function Dashboard() {
  const [tab, setTab] =
    useState<Tab>("inquiries");

  const [identity, setIdentity] =
    useState<AdminIdentity | null>(
      null
    );

  const [inquiries, setInquiries] =
    useState<Inquiry[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [portfolio, setPortfolio] =
    useState<PortfolioItem[]>([]);

  const [settings, setSettings] =
    useState<SiteSettings>(
      DEFAULT_SITE_SETTINGS
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    productModal,
    setProductModal,
  ] = useState<
    Product | "new" | null
  >(null);

  const [
    portfolioModal,
    setPortfolioModal,
  ] = useState<
    PortfolioItem | "new" | null
  >(null);

  const loadIdentity = async () => {
    try {
      const result =
        await adminRequest<{
          ok: boolean;
          user: AdminIdentity;
        }>("/api/admin/session");

      setIdentity(result.user);
    } catch (identityError) {
      console.error(
        "Could not load admin identity:",
        identityError
      );

      setIdentity(null);
    }
  };

  const loadAll = async () => {
    if (!supabase) {
      return;
    }

    setLoading(true);
    setError("");

    const [
      inquiriesResult,
      productsResult,
      portfolioResult,
      settingsResult,
    ] = await Promise.all([
      supabase
        .from("inquiries")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("products")
        .select("*")
        .order("sort_order", {
          ascending: true,
        }),

      supabase
        .from("portfolio_items")
        .select("*")
        .order("sort_order", {
          ascending: true,
        }),

      supabase
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle(),
    ]);

    if (inquiriesResult.error) {
      setError(
        inquiriesResult.error.message
      );
    } else {
      setInquiries(
        (inquiriesResult.data ||
          []) as Inquiry[]
      );
    }

    if (productsResult.error) {
      setError(
        (previous) =>
          previous ||
          productsResult.error!.message
      );
    } else {
      setProducts(
        (productsResult.data ||
          []) as Product[]
      );
    }

    if (portfolioResult.error) {
      setError(
        (previous) =>
          previous ||
          portfolioResult.error!.message
      );
    } else {
      setPortfolio(
        (portfolioResult.data ||
          []) as PortfolioItem[]
      );
    }

    if (settingsResult.data) {
      setSettings({
        ...DEFAULT_SITE_SETTINGS,
        ...settingsResult.data,
      } as SiteSettings);
    }

    setLoading(false);
  };

  useEffect(() => {
    void Promise.all([
      loadAll(),
      loadIdentity(),
    ]);
  }, []);

  const counts = useMemo(
    () => ({
      New: inquiries.filter(
        (item) =>
          normalizeStatus(item.status) ===
          "new"
      ).length,

      Contacted: inquiries.filter(
        (item) =>
          normalizeStatus(item.status) ===
          "contacted"
      ).length,

      Completed: inquiries.filter(
        (item) =>
          normalizeStatus(item.status) ===
          "completed"
      ).length,

      LiveProducts: products.filter(
        (product) => product.active
      ).length,
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
            <img
              src="/images/logo.png"
              alt="SHYIRA Sweet"
              className="h-12 w-12 rounded-full object-cover"
            />

            <div>
              <h1 className="font-display text-2xl font-bold">
                SHYIRA Sweet
              </h1>

              <p className="text-xs text-[#f3ddc7]/60">
                {identity?.role ===
                "owner"
                  ? "Secure Owner Dashboard"
                  : "Secure Admin Dashboard"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                void Promise.all([
                  loadAll(),
                  loadIdentity(),
                ]);
              }}
              className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            >
              Refresh
            </button>

            <a
              href="/"
              className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            >
              View Website
            </a>

            <button
              onClick={logout}
              className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="New Inquiries"
            value={counts.New}
          />

          <StatCard
            label="Contacted"
            value={counts.Contacted}
          />

          <StatCard
            label="Completed"
            value={counts.Completed}
          />

          <StatCard
            label="Live Products"
            value={counts.LiveProducts}
          />
        </div>

        <nav className="mt-8 flex flex-wrap gap-2 rounded-2xl bg-white/5 p-2">
          <TabButton
            active={tab === "inquiries"}
            onClick={() =>
              setTab("inquiries")
            }
          >
            Inquiries
          </TabButton>

          <TabButton
            active={tab === "products"}
            onClick={() =>
              setTab("products")
            }
          >
            Products
          </TabButton>

          <TabButton
            active={tab === "portfolio"}
            onClick={() =>
              setTab("portfolio")
            }
          >
            Gallery / Work
          </TabButton>

          <TabButton
            active={tab === "settings"}
            onClick={() =>
              setTab("settings")
            }
          >
            Settings
          </TabButton>

          {identity?.canManageUsers && (
            <TabButton
              active={tab === "users"}
              onClick={() =>
                setTab("users")
              }
            >
              Admin Users
            </TabButton>
          )}
        </nav>

        {error && (
          <div className="mt-5 rounded-xl bg-red-950/30 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-[#f3ddc7]/60">
            Loading dashboard…
          </div>
        ) : (
          <div className="mt-6">
            {tab === "inquiries" && (
              <InquiriesPanel
                inquiries={inquiries}
                onChanged={loadAll}
              />
            )}

            {tab === "products" && (
              <ProductsPanel
                products={products}
                onAdd={() =>
                  setProductModal("new")
                }
                onEdit={(product) =>
                  setProductModal(product)
                }
                onChanged={loadAll}
              />
            )}

            {tab === "portfolio" && (
              <PortfolioPanel
                items={portfolio}
                onAdd={() =>
                  setPortfolioModal(
                    "new"
                  )
                }
                onEdit={(item) =>
                  setPortfolioModal(item)
                }
                onChanged={loadAll}
              />
            )}

            {tab === "settings" && (
              <SettingsPanel
                settings={settings}
                setSettings={setSettings}
                isOwner={
                  identity?.role === "owner"
                }
              />
            )}

            {tab === "users" &&
              identity?.canManageUsers && (
                <UsersPanel />
              )}
          </div>
        )}
      </main>

      {productModal && (
        <ProductModal
          product={
            productModal === "new"
              ? null
              : productModal
          }
          onClose={() =>
            setProductModal(null)
          }
          onSaved={async () => {
            setProductModal(null);
            await loadAll();
          }}
        />
      )}

      {portfolioModal && (
        <PortfolioModal
          item={
            portfolioModal === "new"
              ? null
              : portfolioModal
          }
          onClose={() =>
            setPortfolioModal(null)
          }
          onSaved={async () => {
            setPortfolioModal(null);
            await loadAll();
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
      <p className="text-sm text-[#f3ddc7]/65">
        {label}
      </p>

      <p className="mt-2 font-display text-4xl font-bold">
        {value}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-5 py-2.5 text-sm font-bold transition ${
        active
          ? "bg-[#f3ddc7] text-[#285c50]"
          : "text-[#f3ddc7]/75 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function InquiriesPanel({
  inquiries,
  onChanged,
}: {
  inquiries: Inquiry[];
  onChanged: () => Promise<void>;
}) {
  const [filter, setFilter] =
    useState<
      "all" | InquiryStatus
    >("all");

  const visible =
    filter === "all"
      ? inquiries
      : inquiries.filter(
          (item) =>
            normalizeStatus(
              item.status
            ) === filter
        );

  const updateStatus = async (
    id: string,
    status: InquiryStatus
  ) => {
    if (!supabase) {
      return;
    }

    const { error } =
      await supabase
        .from("inquiries")
        .update({
          status,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
      alert(error.message);
    } else {
      await onChanged();
    }
  };

  const remove = async (
    id: string
  ) => {
    if (
      !supabase ||
      !confirm(
        "Delete this inquiry permanently?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("inquiries")
        .delete()
        .eq("id", id);

    if (error) {
      alert(error.message);
    } else {
      await onChanged();
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">
            Website Inquiries
          </h2>

          <p className="mt-1 text-sm text-[#f3ddc7]/60">
            Contact requests submitted
            through the website. This is
            not an order system.
          </p>
        </div>

        <select
          value={filter}
          onChange={(event) =>
            setFilter(
              event.target.value as
                | "all"
                | InquiryStatus
            )
          }
          className="rounded-xl border border-white/20 bg-[#285c50] px-4 py-2 text-sm"
        >
          <option value="all">
            All
          </option>

          <option value="new">
            New
          </option>

          <option value="contacted">
            Contacted
          </option>

          <option value="completed">
            Completed
          </option>
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {visible.length === 0 && (
          <p className="rounded-2xl bg-white/5 p-8 text-center text-[#f3ddc7]/55">
            No inquiries here yet.
          </p>
        )}

        {visible.map((item) => {
          const normalized =
            normalizeStatus(
              item.status
            );

          return (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-black/10 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-sm text-[#e8b64a]">
                    {item.contact}
                  </p>

                  <p className="mt-1 text-xs text-[#f3ddc7]/45">
                    {new Date(
                      item.created_at
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={normalized}
                    onChange={(event) =>
                      updateStatus(
                        item.id,
                        event.target
                          .value as InquiryStatus
                      )
                    }
                    className="rounded-lg border border-white/20 bg-[#285c50] px-3 py-2 text-sm"
                  >
                    <option value="new">
                      New
                    </option>

                    <option value="contacted">
                      Contacted
                    </option>

                    <option value="completed">
                      Completed
                    </option>
                  </select>

                  <button
                    onClick={() =>
                      remove(item.id)
                    }
                    className="rounded-lg px-3 py-2 text-sm text-red-200 hover:bg-red-950/30"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-wrap rounded-xl bg-white/5 p-4 text-sm leading-6 text-[#f3ddc7]/85">
                {item.message}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ProductsPanel({
  products,
  onAdd,
  onEdit,
  onChanged,
}: {
  products: Product[];
  onAdd: () => void;
  onEdit: (
    product: Product
  ) => void;
  onChanged: () => Promise<void>;
}) {
  const remove = async (
    product: Product
  ) => {
    if (
      !supabase ||
      !confirm(
        `Delete ${product.name}? This removes it from the public menu.`
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

    if (error) {
      alert(error.message);
    } else {
      await onChanged();
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">
            Manage Products
          </h2>

          <p className="mt-1 text-sm text-[#f3ddc7]/60">
            Add products, edit prices
            and descriptions, upload
            product photos, or hide items
            from the public menu.
          </p>
        </div>

        <button
          onClick={onAdd}
          className="rounded-full bg-[#f3ddc7] px-5 py-2.5 text-sm font-bold text-[#285c50]"
        >
          + Add Product
        </button>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-black/10"
          >
            <img
              src={product.image_url}
              alt={
                product.alt_text ||
                product.name
              }
              className="aspect-[4/3] w-full object-cover"
            />

            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">
                    {product.name}
                  </h3>

                  <p className="text-sm text-[#e8b64a]">
                    {product.price} ·{" "}
                    {product.unit}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                    product.active
                      ? "bg-emerald-400/15 text-emerald-200"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {product.active
                    ? "LIVE"
                    : "HIDDEN"}
                </span>
              </div>

              {product.description && (
                <p className="mt-3 line-clamp-3 text-sm text-[#f3ddc7]/65">
                  {product.description}
                </p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() =>
                    onEdit(product)
                  }
                  className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    remove(product)
                  }
                  className="rounded-lg px-3 py-2 text-sm text-red-200 hover:bg-red-950/30"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] =
    useState<ProductDraft>(
      product
        ? {
            name: product.name,
            description:
              product.description,
            price: product.price,
            unit: product.unit,
            image_url:
              product.image_url,
            alt_text:
              product.alt_text,
            tag: product.tag || "",
            active: product.active,
            sort_order:
              product.sort_order,
          }
        : EMPTY_PRODUCT
    );

  const [file, setFile] =
    useState<File | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const save = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    setSaving(true);
    setError("");

    let imageUrl =
      form.image_url.trim();

    if (file) {
      const safeName =
        file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "-"
        );

      const path = `${Date.now()}-${safeName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("product-images")
          .upload(path, file, {
            upsert: false,
          });

      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        return;
      }

      imageUrl =
        supabase.storage
          .from("product-images")
          .getPublicUrl(path).data
          .publicUrl;
    }

    if (!imageUrl) {
      setError(
        "Please upload an image or enter an image URL."
      );

      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description:
        form.description.trim(),
      price: form.price.trim(),
      unit: form.unit.trim(),
      image_url: imageUrl,
      alt_text:
        form.alt_text.trim(),
      tag:
        form.tag.trim() || null,
      active: form.active,
      sort_order: Number(
        form.sort_order
      ),
      updated_at:
        new Date().toISOString(),
    };

    const result = product
      ? await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id)
      : await supabase
          .from("products")
          .insert(payload);

    if (result.error) {
      setError(
        result.error.message
      );

      setSaving(false);
      return;
    }

    await onSaved();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#285c50] p-7 text-[#f3ddc7] shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-display text-2xl font-bold">
            {product
              ? "Edit Product"
              : "Add Product"}
          </h3>

          <button
            onClick={onClose}
            className="text-2xl text-white/60"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={save}
          className="mt-6 space-y-4"
        >
          <input
            className="ss-input"
            placeholder="Product name"
            required
            value={form.name}
            onChange={(event) =>
              setForm({
                ...form,
                name: event.target.value,
              })
            }
          />

          <textarea
            className="ss-input min-h-28"
            placeholder="Description"
            required
            value={form.description}
            onChange={(event) =>
              setForm({
                ...form,
                description:
                  event.target.value,
              })
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              className="ss-input"
              placeholder="Price, e.g. $50 / $25"
              required
              value={form.price}
              onChange={(event) =>
                setForm({
                  ...form,
                  price:
                    event.target.value,
                })
              }
            />

            <input
              className="ss-input"
              placeholder="Unit, e.g. Large / Small"
              required
              value={form.unit}
              onChange={(event) =>
                setForm({
                  ...form,
                  unit:
                    event.target.value,
                })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              className="ss-input"
              placeholder="Tag (optional)"
              value={form.tag}
              onChange={(event) =>
                setForm({
                  ...form,
                  tag:
                    event.target.value,
                })
              }
            />

            <input
              className="ss-input"
              type="number"
              placeholder="Sort order"
              value={form.sort_order}
              onChange={(event) =>
                setForm({
                  ...form,
                  sort_order: Number(
                    event.target.value
                  ),
                })
              }
            />
          </div>

          <input
            className="ss-input"
            placeholder="Image alt text"
            value={form.alt_text}
            onChange={(event) =>
              setForm({
                ...form,
                alt_text:
                  event.target.value,
              })
            }
          />

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#f3ddc7]/60">
              Upload Product Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setFile(
                  event.target.files?.[0] ||
                    null
                )
              }
              className="mt-2 block w-full text-sm"
            />

            <p className="my-3 text-center text-xs text-white/40">
              OR
            </p>

            <input
              className="ss-input"
              placeholder="Image URL"
              value={form.image_url}
              onChange={(event) =>
                setForm({
                  ...form,
                  image_url:
                    event.target.value,
                })
              }
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                setForm({
                  ...form,
                  active:
                    event.target.checked,
                })
              }
            />

            Show this product on the
            public menu
          </label>

          {error && (
            <p className="rounded-xl bg-red-950/35 p-3 text-sm text-red-100">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-white/25 py-3"
            >
              Cancel
            </button>

            <button
              disabled={saving}
              className="flex-1 rounded-full bg-[#f3ddc7] py-3 font-bold text-[#285c50] disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PortfolioPanel({
  items,
  onAdd,
  onEdit,
  onChanged,
}: {
  items: PortfolioItem[];
  onAdd: () => void;
  onEdit: (
    item: PortfolioItem
  ) => void;
  onChanged: () => Promise<void>;
}) {
  const remove = async (
    id: string
  ) => {
    if (
      !supabase ||
      !confirm(
        "Delete this portfolio item?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("portfolio_items")
        .delete()
        .eq("id", id);

    if (error) {
      alert(error.message);
    } else {
      await onChanged();
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">
            Portfolio / Work Gallery
          </h2>

          <p className="mt-1 text-sm text-[#f3ddc7]/60">
            Add, edit, hide, or remove
            work shown in the public
            gallery.
          </p>
        </div>

        <button
          onClick={onAdd}
          className="rounded-full bg-[#f3ddc7] px-5 py-2.5 text-sm font-bold text-[#285c50]"
        >
          + Add Work
        </button>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-black/10"
          >
            <img
              src={item.image_url}
              alt={item.title}
              className="aspect-[4/3] w-full object-cover"
            />

            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#e8b64a]">
                    {item.category}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                    item.is_visible
                      ? "bg-emerald-400/15 text-emerald-200"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {item.is_visible
                    ? "VISIBLE"
                    : "HIDDEN"}
                </span>
              </div>

              {item.description && (
                <p className="mt-3 line-clamp-2 text-sm text-[#f3ddc7]/65">
                  {item.description}
                </p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() =>
                    onEdit(item)
                  }
                  className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    remove(item.id)
                  }
                  className="rounded-lg px-3 py-2 text-sm text-red-200 hover:bg-red-950/30"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PortfolioModal({
  item,
  onClose,
  onSaved,
}: {
  item: PortfolioItem | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] =
    useState({
      title: item?.title || "",
      category:
        item?.category || "Work",
      description:
        item?.description || "",
      image_url:
        item?.image_url || "",
      sort_order:
        item?.sort_order ?? 0,
      is_visible:
        item?.is_visible ?? true,
    });

  const [file, setFile] =
    useState<File | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const save = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    setSaving(true);
    setError("");

    let imageUrl =
      form.image_url.trim();

    if (file) {
      const safeName =
        file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "-"
        );

      const path = `${Date.now()}-${safeName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("portfolio")
          .upload(path, file, {
            upsert: false,
          });

      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        return;
      }

      imageUrl =
        supabase.storage
          .from("portfolio")
          .getPublicUrl(path).data
          .publicUrl;
    }

    if (!imageUrl) {
      setError(
        "Please upload an image or enter an image URL."
      );

      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      image_url: imageUrl,
      sort_order: Number(
        form.sort_order
      ),
      updated_at:
        new Date().toISOString(),
    };

    const result = item
      ? await supabase
          .from("portfolio_items")
          .update(payload)
          .eq("id", item.id)
      : await supabase
          .from("portfolio_items")
          .insert(payload);

    if (result.error) {
      setError(
        result.error.message
      );

      setSaving(false);
      return;
    }

    await onSaved();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-4">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-[#285c50] p-7 text-[#f3ddc7] shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-display text-2xl font-bold">
            {item
              ? "Edit Work"
              : "Add Work"}
          </h3>

          <button
            onClick={onClose}
            className="text-2xl text-white/60"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={save}
          className="mt-6 space-y-4"
        >
          <input
            className="ss-input"
            placeholder="Title"
            required
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title:
                  event.target.value,
              })
            }
          />

          <input
            className="ss-input"
            placeholder="Category"
            value={form.category}
            onChange={(event) =>
              setForm({
                ...form,
                category:
                  event.target.value,
              })
            }
          />

          <textarea
            className="ss-input min-h-24"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(event) =>
              setForm({
                ...form,
                description:
                  event.target.value,
              })
            }
          />

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#f3ddc7]/60">
              Upload Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setFile(
                  event.target.files?.[0] ||
                    null
                )
              }
              className="block w-full text-sm"
            />
          </div>

          <div className="text-center text-xs text-white/40">
            OR
          </div>

          <input
            className="ss-input"
            placeholder="Image URL"
            value={form.image_url}
            onChange={(event) =>
              setForm({
                ...form,
                image_url:
                  event.target.value,
              })
            }
          />

          <input
            className="ss-input"
            type="number"
            placeholder="Sort order"
            value={form.sort_order}
            onChange={(event) =>
              setForm({
                ...form,
                sort_order: Number(
                  event.target.value
                ),
              })
            }
          />

          <label className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-sm">
            <input
              type="checkbox"
              checked={form.is_visible}
              onChange={(event) =>
                setForm({
                  ...form,
                  is_visible:
                    event.target.checked,
                })
              }
            />

            Visible on public website
          </label>

          {error && (
            <p className="rounded-xl bg-red-950/35 p-3 text-sm text-red-100">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-white/25 py-3"
            >
              Cancel
            </button>

            <button
              disabled={saving}
              className="flex-1 rounded-full bg-[#f3ddc7] py-3 font-bold text-[#285c50] disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SettingsPanel({
  settings,
  setSettings,
  isOwner,
}: {
  settings: SiteSettings;
  setSettings: (
    settings: SiteSettings
  ) => void;
  isOwner: boolean;
}) {
  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<
      "success" | "error" | ""
    >("");

  const save = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const result =
        await adminRequest<{
          ok: boolean;
          settings: SiteSettings;
          copyrightEditable: boolean;
        }>(
          "/api/admin/settings",
          {
            method: "PATCH",
            body: JSON.stringify({
              phone_display:
                settings.phone_display,
              phone_link:
                settings.phone_link,
              whatsapp_link:
                settings.whatsapp_link,
              city: settings.city,
              instagram_url:
                settings.instagram_url,
              instagram_handle:
                settings.instagram_handle,
              facebook_url:
                settings.facebook_url,
              footer_tagline:
                settings.footer_tagline,
              footer_rights_text:
                settings.footer_rights_text,
            }),
          }
        );

      setSettings({
        ...DEFAULT_SITE_SETTINGS,
        ...result.settings,
      } as SiteSettings);

      setMessageType("success");

      setMessage(
        result.copyrightEditable
          ? "Settings saved, including the copyright / rights text."
          : "Settings saved. The copyright / rights text remained protected and unchanged."
      );
    } catch (saveError) {
      setMessageType("error");

      setMessage(
        saveError instanceof Error
          ? saveError.message
          : "Could not save website settings."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
      <div>
        <h2 className="font-display text-2xl font-bold">
          Website Settings
        </h2>

        <p className="mt-1 text-sm text-[#f3ddc7]/60">
          Update contact links and footer
          text without editing GitHub code.
        </p>
      </div>

      <form
        onSubmit={save}
        className="mt-6 grid gap-5 md:grid-cols-2"
      >
        <SettingField label="Phone display">
          <input
            className="ss-input"
            value={settings.phone_display}
            onChange={(event) =>
              setSettings({
                ...settings,
                phone_display:
                  event.target.value,
              })
            }
          />
        </SettingField>

        <SettingField label="Phone link (digits only)">
          <input
            className="ss-input"
            value={settings.phone_link}
            onChange={(event) =>
              setSettings({
                ...settings,
                phone_link:
                  event.target.value,
              })
            }
          />
        </SettingField>

        <SettingField label="WhatsApp number (digits only)">
          <input
            className="ss-input"
            value={
              settings.whatsapp_link
            }
            onChange={(event) =>
              setSettings({
                ...settings,
                whatsapp_link:
                  event.target.value,
              })
            }
          />
        </SettingField>

        <SettingField label="City">
          <input
            className="ss-input"
            value={settings.city}
            onChange={(event) =>
              setSettings({
                ...settings,
                city:
                  event.target.value,
              })
            }
          />
        </SettingField>

        <SettingField label="Instagram URL">
          <input
            className="ss-input"
            value={
              settings.instagram_url
            }
            onChange={(event) =>
              setSettings({
                ...settings,
                instagram_url:
                  event.target.value,
              })
            }
          />
        </SettingField>

        <SettingField label="Instagram handle">
          <input
            className="ss-input"
            value={
              settings.instagram_handle
            }
            onChange={(event) =>
              setSettings({
                ...settings,
                instagram_handle:
                  event.target.value,
              })
            }
          />
        </SettingField>

        <SettingField label="Facebook URL">
          <input
            className="ss-input"
            value={
              settings.facebook_url
            }
            onChange={(event) =>
              setSettings({
                ...settings,
                facebook_url:
                  event.target.value,
              })
            }
          />
        </SettingField>

        <SettingField label="Footer tagline">
          <input
            className="ss-input"
            value={
              settings.footer_tagline
            }
            onChange={(event) =>
              setSettings({
                ...settings,
                footer_tagline:
                  event.target.value,
              })
            }
          />
        </SettingField>

        <div className="md:col-span-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-[#f3ddc7]/55">
              Copyright / rights text
            </span>

            {!isOwner && (
              <span className="rounded-full border border-[#e8b64a]/30 bg-[#e8b64a]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#e8b64a]">
                Owner Only
              </span>
            )}
          </div>

          <input
            className={`ss-input ${
              !isOwner
                ? "cursor-not-allowed opacity-65"
                : ""
            }`}
            value={
              settings.footer_rights_text
            }
            readOnly={!isOwner}
            aria-readonly={!isOwner}
            onChange={(event) => {
              if (!isOwner) {
                return;
              }

              setSettings({
                ...settings,
                footer_rights_text:
                  event.target.value,
              });
            }}
          />

          <p className="mt-2 text-xs text-[#f3ddc7]/45">
            The year is automatic. Example
            output: ©{" "}
            {new Date().getFullYear()}{" "}
            {settings.footer_rights_text}
          </p>

          {!isOwner && (
            <p className="mt-2 text-xs leading-5 text-[#e8b64a]/80">
              Only the main owner can change
              this text. Admin accounts may
              view it but cannot edit or
              overwrite it.
            </p>
          )}
        </div>

        {message && (
          <p
            className={`md:col-span-2 rounded-xl p-3 text-sm ${
              messageType === "error"
                ? "bg-red-950/35 text-red-100"
                : "bg-emerald-950/25 text-emerald-100"
            }`}
          >
            {message}
          </p>
        )}

        <button
          disabled={saving}
          className="md:col-span-2 rounded-full bg-[#f3ddc7] px-6 py-3 font-bold text-[#285c50] disabled:opacity-60"
        >
          {saving
            ? "Saving…"
            : "Save Website Settings"}
        </button>
      </form>
    </section>
  );
}

function SettingField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#f3ddc7]/55">
        {label}
      </span>

      {children}
    </label>
  );
}

function generateStrongPassword(): string {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%&*+-_?";
  const all =
    uppercase +
    lowercase +
    numbers +
    symbols;

  const randomIndex = (
    maximum: number
  ) => {
    const values =
      new Uint32Array(1);

    crypto.getRandomValues(values);

    return values[0] % maximum;
  };

  const characters = [
    uppercase[
      randomIndex(uppercase.length)
    ],
    lowercase[
      randomIndex(lowercase.length)
    ],
    numbers[
      randomIndex(numbers.length)
    ],
    symbols[
      randomIndex(symbols.length)
    ],
  ];

  while (characters.length < 16) {
    characters.push(
      all[randomIndex(all.length)]
    );
  }

  for (
    let index = characters.length - 1;
    index > 0;
    index -= 1
  ) {
    const swapIndex =
      randomIndex(index + 1);

    [
      characters[index],
      characters[swapIndex],
    ] = [
      characters[swapIndex],
      characters[index],
    ];
  }

  return characters.join("");
}

function formatAccountDate(
  value: string | null
): string {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function UsersPanel() {
  const [users, setUsers] =
    useState<AdminAccount[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    createdCredentials,
    setCreatedCredentials,
  ] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const result =
        await adminRequest<{
          ok: boolean;
          users: AdminAccount[];
        }>("/api/admin/users");

      setUsers(result.users);
    } catch (usersError) {
      setError(
        usersError instanceof Error
          ? usersError.message
          : "Could not load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const createUser = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setCreatedCredentials(null);

    if (password !== confirmPassword) {
      setError(
        "The passwords do not match."
      );
      return;
    }

    setSaving(true);

    try {
      await adminRequest<{
        ok: boolean;
        user: AdminAccount;
      }>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          email,
          password,
        }),
      });

      setCreatedCredentials({
        email:
          email.trim().toLowerCase(),
        password,
      });

      setSuccess(
        "The admin account was created and can sign in immediately. No invitation email was sent."
      );

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      await loadUsers();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not create the account."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateAccount = async (
    userId: string,
    payload: {
      fullName?: string;
      password?: string;
      active?: boolean;
    }
  ) => {
    setError("");
    setSuccess("");

    try {
      await adminRequest<{
        ok: boolean;
        user: AdminAccount;
      }>(
        `/api/admin/users/${userId}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );

      setSuccess(
        "The account was updated."
      );

      await loadUsers();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update the account."
      );
    }
  };

  const resetPassword = async (
    user: AdminAccount
  ) => {
    const newPassword =
      window.prompt(
        `Enter a new temporary password for ${user.email}.\n\nUse at least 12 characters with uppercase, lowercase, a number, and a symbol.`
      );

    if (!newPassword) {
      return;
    }

    await updateAccount(user.id, {
      password: newPassword,
    });
  };

  const renameAccount = async (
    user: AdminAccount
  ) => {
    const newName =
      window.prompt(
        "Enter the account holder's full name:",
        user.fullName
      );

    if (!newName) {
      return;
    }

    await updateAccount(user.id, {
      fullName: newName,
    });
  };

  const toggleAccount = async (
    user: AdminAccount
  ) => {
    const action =
      user.active
        ? "disable"
        : "enable";

    const confirmed =
      window.confirm(
        `${
          action === "disable"
            ? "Disable"
            : "Enable"
        } dashboard access for ${user.email}?`
      );

    if (!confirmed) {
      return;
    }

    await updateAccount(user.id, {
      active: !user.active,
    });
  };

  const deleteAccount = async (
    user: AdminAccount
  ) => {
    const confirmed =
      window.confirm(
        `Permanently delete ${user.email}?\n\nThis removes the login account and cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await adminRequest<{
        ok: boolean;
      }>(
        `/api/admin/users/${user.id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        "The account was permanently deleted."
      );

      await loadUsers();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the account."
      );
    }
  };

  const fillGeneratedPassword =
    () => {
      const generated =
        generateStrongPassword();

      setPassword(generated);
      setConfirmPassword(generated);
    };

  const copyCredentials = async () => {
    if (!createdCredentials) {
      return;
    }

    const text = [
      "SHIYRA Sweet Admin Login",
      "https://shiyrasweet.com/?admin",
      "",
      `Email: ${createdCredentials.email}`,
      `Temporary Password: ${createdCredentials.password}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(
        text
      );

      setSuccess(
        "Login details copied."
      );
    } catch {
      setError(
        "Could not copy automatically. Select and copy the details manually."
      );
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e8b64a]">
          Owner Only
        </p>

        <h2 className="mt-2 font-display text-2xl font-bold">
          Admin Users
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#f3ddc7]/65">
          Create a dashboard login directly.
          The new user receives no Supabase
          invitation and no confirmation email.
          You provide the login URL, email, and
          temporary password yourself.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          onSubmit={createUser}
          className="rounded-3xl border border-white/10 bg-black/10 p-5 sm:p-7"
        >
          <h3 className="font-display text-xl font-bold">
            Create New Admin Account
          </h3>

          <div className="mt-6 space-y-4">
            <SettingField label="Full name">
              <input
                className="ss-input"
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value
                  )
                }
                placeholder="Full name"
                maxLength={120}
                required
              />
            </SettingField>

            <SettingField label="Email address">
              <input
                className="ss-input"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="name@example.com"
                autoComplete="off"
                required
              />
            </SettingField>

            <SettingField label="Temporary password">
              <input
                className="ss-input"
                type="text"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="At least 12 characters"
                autoComplete="off"
                required
              />
            </SettingField>

            <SettingField label="Confirm password">
              <input
                className="ss-input"
                type="text"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Repeat password"
                autoComplete="off"
                required
              />
            </SettingField>

            <button
              type="button"
              onClick={
                fillGeneratedPassword
              }
              className="w-full rounded-full border border-white/20 px-5 py-3 text-sm font-bold hover:bg-white/10"
            >
              Generate Strong Password
            </button>

            <p className="text-xs leading-5 text-[#f3ddc7]/50">
              Passwords require at least 12
              characters with uppercase,
              lowercase, a number, and a
              symbol.
            </p>

            <button
              disabled={saving}
              className="w-full rounded-full bg-[#f3ddc7] px-5 py-3 font-bold text-[#285c50] disabled:opacity-60"
            >
              {saving
                ? "Creating Account…"
                : "Create Account"}
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-white/10 bg-black/10 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-bold">
                Dashboard Accounts
              </h3>

              <p className="mt-1 text-sm text-[#f3ddc7]/55">
                Enable, disable, reset, or
                delete admin logins.
              </p>
            </div>

            <button
              onClick={() =>
                void loadUsers()
              }
              className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="mt-8 text-center text-[#f3ddc7]/55">
              Loading accounts…
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {users.map((user) => (
                <article
                  key={user.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold">
                          {user.fullName ||
                            "Unnamed account"}
                        </h4>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                            user.active
                              ? "bg-emerald-400/15 text-emerald-200"
                              : "bg-red-400/15 text-red-200"
                          }`}
                        >
                          {user.active
                            ? "ACTIVE"
                            : "DISABLED"}
                        </span>

                        <span className="rounded-full bg-[#e8b64a]/15 px-2 py-1 text-[10px] font-bold uppercase text-[#e8b64a]">
                          {user.role}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-[#e8b64a]">
                        {user.email}
                      </p>

                      <p className="mt-2 text-xs text-[#f3ddc7]/45">
                        Created:{" "}
                        {formatAccountDate(
                          user.createdAt
                        )}
                      </p>

                      <p className="mt-1 text-xs text-[#f3ddc7]/45">
                        Last sign in:{" "}
                        {formatAccountDate(
                          user.lastSignInAt
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        void renameAccount(
                          user
                        )
                      }
                      className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15"
                    >
                      Edit Name
                    </button>

                    <button
                      onClick={() =>
                        void resetPassword(
                          user
                        )
                      }
                      className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15"
                    >
                      Reset Password
                    </button>

                    {!user.isOwner && (
                      <>
                        <button
                          onClick={() =>
                            void toggleAccount(
                              user
                            )
                          }
                          className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/15"
                        >
                          {user.active
                            ? "Disable"
                            : "Enable"}
                        </button>

                        <button
                          onClick={() =>
                            void deleteAccount(
                              user
                            )
                          }
                          className="rounded-lg px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-950/30"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}

              {users.length === 0 && (
                <p className="rounded-2xl bg-white/5 p-8 text-center text-[#f3ddc7]/55">
                  No dashboard accounts
                  were found.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-300/10 bg-red-950/35 p-4 text-sm text-red-100">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-2xl border border-emerald-300/10 bg-emerald-950/25 p-4 text-sm text-emerald-100">
          {success}
        </p>
      )}

      {createdCredentials && (
        <div className="rounded-3xl border border-[#e8b64a]/30 bg-[#e8b64a]/10 p-5 sm:p-7">
          <h3 className="font-display text-xl font-bold text-[#f3ddc7]">
            New Login Details
          </h3>

          <p className="mt-2 text-sm text-[#f3ddc7]/65">
            Save these details now. The
            password is not stored or shown
            here again.
          </p>

          <div className="mt-5 rounded-2xl bg-black/20 p-5 font-mono text-sm leading-7">
            <p>
              Login:{" "}
              https://shiyrasweet.com/?admin
            </p>

            <p>
              Email:{" "}
              {createdCredentials.email}
            </p>

            <p>
              Temporary Password:{" "}
              {createdCredentials.password}
            </p>
          </div>

          <button
            onClick={() =>
              void copyCredentials()
            }
            className="mt-4 rounded-full bg-[#f3ddc7] px-5 py-3 text-sm font-bold text-[#285c50]"
          >
            Copy Login Details
          </button>
        </div>
      )}
    </section>
  );
}
