'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, XCircle, Plus, Trash2, LogOut, Store, MessageCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');

  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    store_name: 'SK Store',
    whatsapp_number: '',
    delivery_charge: 40,
    free_delivery_above: 499,
    upi_id: '',
    is_open: true,
  });

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mrp, setMrp] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [category, setCategory] = useState('');
  const [variants, setVariants] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData();
    });
  }, []);

  const fetchAllData = async () => {
    const { data: ord } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (ord) setOrders(ord);

    const { data: prod } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (prod) setProducts(prod);

    const { data: set } = await supabase.from('store_settings').select('*').eq('id', 1).single();
    if (set) setSettings(set);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert('Login failed: ' + error.message);
    setSession(data.session);
    fetchAllData();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return alert('Kripya product ki real photo select karein!');
    setUploading(true);

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from('products').insert([
        {
          name,
          description,
          mrp: Number(mrp),
          selling_price: Number(sellingPrice),
          category: category || 'General',
          variants,
          image_url: publicUrlData.publicUrl,
          in_stock: true,
        },
      ]);

      if (insertError) throw insertError;

      alert('Product successfully add ho gaya!');
      setName('');
      setDescription('');
      setMrp('');
      setSellingPrice('');
      setCategory('');
      setVariants('');
      setImageFile(null);
      fetchAllData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleOrderAction = async (order: any, newStatus: 'accepted' | 'rejected') => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
    if (error) return alert(error.message);

    fetchAllData();

    const cleanPhone = order.phone.replace(/\D/g, '');
    const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const itemsList = order.items
      .map((i: any) => `• ${i.name} ${i.variant ? `(${i.variant})` : ''} x${i.qty} = ₹${i.price * i.qty}`)
      .join('\n');

    const message =
      newStatus === 'accepted'
        ? `Namaste *${order.customer_name}*! 🙏\n\n*SK Store* se aapka Order *#${order.id}* *ACCEPT* kar liya gaya hai.\n\n*Order Details:*\n${itemsList}\n\n*Total Amount:* ₹${order.total_amount} (${order.payment_method})\n*Delivery Address:* ${order.address}\n\nAapka order jald hi dispatch kiya jayega. Dhanyawad!`
        : `Namaste *${order.customer_name}*, maafi chahte hain ki *SK Store* par aapka Order *#${order.id}* abhi accept nahi ho pa raha hai (item out of stock / delivery unavailable). Kripya adhik jaankari ke liye reply karein.`;

    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const toggleStock = async (id: string, current: boolean) => {
    await supabase.from('products').update({ in_stock: !current }).eq('id', id);
    fetchAllData();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Kya aap is product ko delete karna chahte hain?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchAllData();
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('store_settings').update(settings).eq('id', 1);
    if (error) alert(error.message);
    else alert('Store settings save ho gayi!');
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 justify-center mb-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-extrabold text-white">
              S<span className="text-amber-400">K</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">SK Admin Login</h2>
          </div>
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900"
          />
          <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-800">
            Login to Dashboard
          </button>
        </form>
      </div>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.status === 'accepted' || o.status === 'delivered')
    .reduce((acc, o) => acc + Number(o.total_amount), 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900">
      <div className="bg-slate-900 text-white px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 font-black px-2 py-1 rounded-lg text-sm">SK</span>
            <h1 className="font-bold text-base">Owner Dashboard</h1>
          </div>
          <button
            onClick={() => {
              supabase.auth.signOut();
              setSession(null);
            }}
            className="text-xs flex items-center gap-1 text-slate-300 hover:text-white"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">Pending Orders</p>
          <p className="text-2xl font-extrabold text-amber-600">
            {orders.filter((o) => o.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">Total Products</p>
          <p className="text-2xl font-extrabold text-slate-900">{products.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">Confirmed Sales</p>
          <p className="text-2xl font-extrabold text-emerald-600">₹{totalRevenue}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6 flex gap-2">
        {(['orders', 'products', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition ${
              activeTab === tab ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 && (
              <div className="bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-200">
                Abhi tak koi order nahi aaya hai.
              </div>
            )}
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      Order #{order.id}
                    </span>
                    <h3 className="font-bold text-slate-900 mt-1">{order.customer_name}</h3>
                    <p className="text-xs text-slate-600">📞 {order.phone} • {order.address}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                      order.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-700'
                        : order.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.name} {item.variant && `(${item.variant})`} × {item.qty}
                      </span>
                      <span className="font-semibold">₹{item.price * item.qty}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between font-bold text-slate-900">
                    <span>Total ({order.payment_method} {order.utr_number ? `- UTR: ${order.utr_number}` : ''})</span>
                    <span>₹{order.total_amount}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleOrderAction(order, 'accepted')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" /> Accept & WhatsApp
                  </button>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleOrderAction(order, 'rejected')}
                      className="px-4 bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="grid md:grid-cols-2 gap-6">
            <form onSubmit={handleAddProduct} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 h-fit">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600" /> Add Real Product
              </h2>
              <input
                type="text"
                placeholder="Product Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Short Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="MRP (₹) *"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Selling Price (₹) *"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Category (e.g. Nutrition, Shoes)"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Sizes/Variants (250g, 500g)"
                  value={variants}
                  onChange={(e) => setVariants(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <label className="block border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer hover:border-amber-500">
                <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                <span className="text-xs font-medium text-slate-600">
                  {imageFile ? imageFile.name : 'Click karke apni real photo upload karein *'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Publish Product'}
              </button>
            </form>

            <div className="space-y-3">
              {products.length === 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-sm text-slate-500 text-center">
                  Abhi koi product upload nahi hua hai. Left form se apna pehla product dalein.
                </div>
              )}
              {products.map((p) => (
                <div key={p.id} className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-3">
                  <img src={p.image_url} alt={p.name} className="w-16 h-16 rounded-xl object-cover bg-slate-100" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{p.name}</h4>
                    <p className="text-xs text-slate-500">
                      ₹{p.selling_price} <span className="line-through">₹{p.mrp}</span> • {p.category}
                    </p>
                    <button
                      onClick={() => toggleStock(p.id, p.in_stock)}
                      className={`mt-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                        p.in_stock ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {p.in_stock ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </div>
                  <button onClick={() => deleteProduct(p.id)} className="p-2 text-slate-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <form onSubmit={saveSettings} className="bg-white p-5 rounded-2xl border border-slate-200 max-w-lg space-y-4">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-600" /> Store & Delivery Rules
            </h2>
            <div>
              <label className="text-xs font-semibold text-slate-600">Delivery Charge (₹)</label>
              <input
                type="number"
                value={settings.delivery_charge}
                onChange={(e) => setSettings({ ...settings, delivery_charge: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Free Delivery Above Order Amount (₹)</label>
              <input
                type="number"
                value={settings.free_delivery_above}
                onChange={(e) => setSettings({ ...settings, free_delivery_above: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Owner UPI ID (Online Payment ke liye)</label>
              <input
                type="text"
                placeholder="example@okaxis"
                value={settings.upi_id}
                onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm mt-1"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-semibold text-slate-800">Store Status (Open for Orders)</span>
              <input
                type="checkbox"
                checked={settings.is_open}
                onChange={(e) => setSettings({ ...settings, is_open: e.target.checked })}
                className="w-5 h-5 accent-slate-900"
              />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold">
              Save Business Settings
            </button>
          </form>
        )}
      </div>
    </div>
  );
}