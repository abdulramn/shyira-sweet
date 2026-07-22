import { useState, useEffect } from "react";

/*
  ================= ADMIN DASHBOARD =================
  Simple in-browser dashboard for the owner to:
  - View KPIs (visitors, products count, estimated revenue)
  - Add / Edit / Delete products
  - All data saved in localStorage (persists in the browser)
  
  Access: Add "?admin" to the URL or create a hidden link
*/

type Product = {
  id: number;
  name: string;
  desc: string;
  price: string;
  unit: string;
  image: string;
  tag?: string;
};

const DEFAULT_PRODUCTS: Product[] = [
  { id: 1, name: "Kunafa Cheese", desc: "Freshly baked cheese kunafa — golden, crispy, and stretchy.", price: "$50 / $25", unit: "Large / Small", image: "/images/kunafa.jpg", tag: "Signature" },
  { id: 2, name: "Halawa Al-Jubn", desc: "Traditional cheese halawa — soft, sweet, and delicately layered.", price: "$60 / $30", unit: "Large / Small", image: "/images/halawa.jpg", tag: "" },
  { id: 3, name: "Madlouqa", desc: "Crispy layered pastry soaked in fragrant syrup.", price: "$40 / $80", unit: "Small / Large", image: "/images/madlouqa.jpg", tag: "" },
  { id: 4, name: "Baklava", desc: "Classic Syrian baklava with layers of phyllo, butter, and nuts.", price: "$40 / $20", unit: "Large / Small", image: "https://images.pexels.com/photos/15794015/pexels-photo-15794015.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200", tag: "Best seller" },
];

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [visitors] = useState(1247); // Mock KPI
  const [editing, setEditing] = useState<Product | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("shyira_products");
    if (saved) setProducts(JSON.parse(saved));
  }, []);

  // Save to localStorage
  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem("shyira_products", JSON.stringify(newProducts));
  };

  // Add new product
  const addProduct = (p: Omit<Product, "id">) => {
    const newP = { ...p, id: Date.now() };
    saveProducts([...products, newP]);
    setShowAdd(false);
  };

  // Update product
  const updateProduct = (updated: Product) => {
    const newList = products.map((p) => (p.id === updated.id ? updated : p));
    saveProducts(newList);
    setEditing(null);
  };

  // Delete product
  const deleteProduct = (id: number) => {
    if (!confirm("Delete this product?")) return;
    saveProducts(products.filter((p) => p.id !== id));
  };

  const totalProducts = products.length;
  const estimatedRevenue = totalProducts * 180; // Mock calculation

  return (
    <div className="min-h-screen bg-[#285c50] p-6 text-[#f3ddc7]">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold">SHYIRA Sweet</h1>
            <p className="text-[#f3ddc7]/70">Owner Dashboard</p>
          </div>
          <a href="/" className="rounded-full border border-[#f3ddc7]/40 px-5 py-2 text-sm hover:bg-white/10">
            ← Back to Website
          </a>
        </div>

        {/* KPI Cards */}
        <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-6">
            <div className="text-sm text-[#f3ddc7]/70">Total Visitors</div>
            <div className="mt-1 font-display text-4xl font-bold">{visitors.toLocaleString()}</div>
            <div className="text-xs text-emerald-400">+18% this month</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-6">
            <div className="text-sm text-[#f3ddc7]/70">Active Products</div>
            <div className="mt-1 font-display text-4xl font-bold">{totalProducts}</div>
            <div className="text-xs text-emerald-400">Live on menu</div>
          </div>
          <div className="rounded-2xl bg-white/10 p-6">
            <div className="text-sm text-[#f3ddc7]/70">Est. Monthly Revenue</div>
            <div className="mt-1 font-display text-4xl font-bold">${estimatedRevenue}</div>
            <div className="text-xs text-emerald-400">Based on average orders</div>
          </div>
        </div>

        {/* Products Management */}
        <div className="rounded-3xl bg-white/5 p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Manage Products</h2>
            <button
              onClick={() => setShowAdd(true)}
              className="rounded-full bg-[#f3ddc7] px-6 py-2 text-sm font-bold text-[#285c50] hover:bg-white"
            >
              + Add New Product
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/20 text-[#f3ddc7]/70">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Unit</th>
                  <th className="pb-3">Tag</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-4 font-semibold">{p.name}</td>
                    <td className="py-4 text-[#f3ddc7]/90">{p.price}</td>
                    <td className="py-4 text-[#f3ddc7]/90">{p.unit}</td>
                    <td className="py-4">
                      {p.tag && <span className="rounded bg-[#f3ddc7]/20 px-2 py-0.5 text-xs">{p.tag}</span>}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => setEditing(p)}
                        className="mr-3 text-[#f3ddc7]/80 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#f3ddc7]/60">
          All changes are saved automatically in your browser. Data resets if you clear browser storage.
        </p>
      </div>

      {/* Add/Edit Modal */}
      {(showAdd || editing) && (
        <ProductModal
          product={editing}
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
          onSave={(p) => (editing ? updateProduct(p as Product) : addProduct(p))}
        />
      )}
    </div>
  );
}

/* Simple modal for adding/editing products */
function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (p: any) => void;
}) {
  const [form, setForm] = useState({
    name: product?.name || "",
    desc: product?.desc || "",
    price: product?.price || "",
    unit: product?.unit || "",
    image: product?.image || "/images/kunafa.jpg",
    tag: product?.tag || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(product ? { ...product, ...form } : form);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-[#285c50] p-8 text-[#f3ddc7]">
        <h3 className="mb-6 font-display text-2xl font-bold">{product ? "Edit Product" : "Add New Product"}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="ss-input" placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <textarea className="ss-input h-20 resize-y" placeholder="Description" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <input className="ss-input" placeholder="Price (e.g. $50 / $25)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <input className="ss-input" placeholder="Unit (e.g. Large / Small)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
          </div>
          <input className="ss-input" placeholder="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          <input className="ss-input" placeholder="Tag (optional)" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 rounded-full border border-white/30 py-3">Cancel</button>
            <button type="submit" className="flex-1 rounded-full bg-[#f3ddc7] py-3 font-bold text-[#285c50]">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  );
}
