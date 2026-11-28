'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import {
  Search,
  Plus,
  Minus,
  X,
  ShoppingBag,
  CheckCircle2,
  Sparkles,
  Tag,
  Truck,
  MessageCircle,
  MapPin,
  Mail,
  ShieldCheck,
} from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVariants, setSelectedVariants] = useState<{ [key: string]: string }>({});

  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI'>('COD');
  const [utrNumber, setUtrNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<number | null>(null);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      const { data: prod } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (prod) setProducts(prod);

      const { data: set } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (set) setSettings(set);
    } catch (err) {
      console.error('Error loading store:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleDirectWhatsAppOrder = (product: any) => {
    const variantList = product.variants
      ? product.variants.split(',').map((v: string) => v.trim()).filter(Boolean)
      : [];
    const chosenVariant = selectedVariants[product.id] || variantList[0] || '';

    const rawOwnerPhone = (settings?.whatsapp_number || '').replace(/\D/g, '');
    const ownerWaPhone =
      rawOwnerPhone.length === 10
        ? `91${rawOwnerPhone}`
        : rawOwnerPhone || '919999999999'; // Admin Settings mein apna number save karein

    const message = `Namaste *SK Premium Superfoods*! 🙏\n\nMujhe yeh product order karna hai:\n• *Product:* ${product.name}${chosenVariant ? ` (${chosenVariant})` : ''}\n• *Price:* ₹${product.selling_price}\n\nKripya delivery details batayein.`;

    window.open(`https://wa.me/${ownerWaPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const addToCart = (product: any) => {
    const variantList = product.variants ? product.variants.split(',').map((v: string) => v.trim()) : [];
    const chosenVariant = selectedVariants[product.id] || variantList[0] || '';

    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === product.id && i.variant === chosenVariant);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].qty += 1;
        return updated;
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.selling_price),
          image_url: product.image_url,
          variant: chosenVariant,
          qty: 1,
        },
      ];
    });
  };

  const updateQty = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index].qty += delta;
      if (updated[index].qty <= 0) updated.splice(index, 1);
      return updated;
    });
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryCharge = Number(settings?.delivery_charge ?? 40);
  const freeAbove = Number(settings?.free_delivery_above ?? 499);
  const deliveryFee = subtotal === 0 || subtotal >= freeAbove ? 0 : deliveryCharge;
  const totalAmount = subtotal + deliveryFee;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (paymentMethod === 'UPI' && !utrNumber.trim()) {
      return alert('Kripya UPI payment karne ke baad 12-digit UTR / Transaction ID dalein.');
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: customerName,
            phone,
            address,
            payment_method: paymentMethod,
            utr_number: paymentMethod === 'UPI' ? utrNumber : null,
            items: cart,
            subtotal,
            delivery_fee: deliveryFee,
            total_amount: totalAmount,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setOrderSuccessId(data.id);
      setCart([]);
      setCustomerName('');
      setPhone('');
      setAddress('');
      setUtrNumber('');
    } catch (err: any) {
      alert('Order error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar cartCount={cart.reduce((s, i) => s + i.qty, 0)} onOpenCart={() => setIsCartOpen(true)} />

      {settings && !settings.is_open && (
        <div className="bg-red-600 text-white text-center py-2.5 px-4 text-xs font-bold">
          Store abhi temporarily closed hai. Naye orders jald shuru honge!
        </div>
      )}

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" /> 100% Natural | Pure &amp; Homemade
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome to <span className="text-amber-400">SK Premium Superfoods</span>
            </h2>
            <p className="text-slate-300 text-sm max-w-lg">
              शुद्ध आयुर्वेदिक और घर के बने पौष्टिक सुपरफूड्स — बिना किसी केमिकल या प्रिजर्वेटिव के सीधे आपके घर तक।
            </p>
            {settings && (
              <div className="inline-flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/80 border border-emerald-700/40 px-3 py-1.5 rounded-lg">
                <Truck className="w-4 h-4" /> ₹{settings.free_delivery_above} se upar ke order par FREE Delivery!
              </div>
            )}
          </div>

          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search superfoods & herbal tea..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </section>

      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="max-w-6xl mx-auto w-full px-4 pt-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Product Grid */}
      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-1">
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm">
            Loading SK Premium Superfoods catalog...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800">Abhi koi product listed nahi hai</h3>
            <p className="text-xs text-slate-500 mt-1">Store owner jald hi naye superfoods upload karenge.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const discount =
                product.mrp > product.selling_price
                  ? Math.round(((product.mrp - product.selling_price) / product.mrp) * 100)
                  : 0;
              const variantList = product.variants
                ? product.variants.split(',').map((v: string) => v.trim()).filter(Boolean)
                : [];

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                >
                  <div className="relative aspect-square bg-slate-100 overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                    {discount > 0 && (
                      <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow">
                        <Tag className="w-3 h-3" /> {discount}% OFF
                      </span>
                    )}
                    {!product.in_stock && (
                      <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                        <span className="bg-white text-slate-900 text-xs font-extrabold px-3 py-1 rounded-full">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                        {product.category}
                      </p>
                      <h3 className="font-bold text-slate-900 text-base mt-0.5">{product.name}</h3>
                      {product.description && (
                        <p className="text-xs text-slate-600 leading-relaxed mt-2">{product.description}</p>
                      )}
                    </div>

                    {variantList.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {variantList.map((v: string) => {
                          const active = (selectedVariants[product.id] || variantList[0]) === v;
                          return (
                            <button
                              key={v}
                              onClick={() => setSelectedVariants({ ...selectedVariants, [product.id]: v })}
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${
                                active
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              {v}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-xl text-slate-900">₹{product.selling_price}</span>
                          {product.mrp > product.selling_price && (
                            <span className="text-xs text-slate-400 line-through ml-2">MRP ₹{product.mrp}</span>
                          )}
                        </div>

                        <button
                          disabled={!product.in_stock || (settings && !settings.is_open)}
                          onClick={() => addToCart(product)}
                          className="bg-slate-900 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition disabled:opacity-40 cursor-pointer"
                        >
                          + Add to Cart
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={!product.in_stock || (settings && !settings.is_open)}
                        onClick={() => handleDirectWhatsAppOrder(product)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-40 cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" /> Order on WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-2 md:grid-cols-3 gap-8 text-xs">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded text-sm">SK</span>
              <h4 className="text-white font-bold text-base">SK Premium Superfoods</h4>
            </div>
            <p className="text-emerald-400 font-semibold">100% Natural | Pure &amp; Homemade</p>
            <p className="text-slate-400 leading-relaxed">
              Handcrafted traditional nutrition mixes and caffeine-free herbal teas prepared with pure ingredients.
            </p>
          </div>

          <div className="space-y-2.5">
            <h5 className="text-white font-bold uppercase tracking-wider text-xs">Contact &amp; Address</h5>
            <p className="flex items-start gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Rehati Bataspur, Post Oina, Dist. Jaunpur, Uttar Pradesh</span>
            </p>
            <p className="flex items-center gap-2 text-slate-300">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <a href="mailto:salman545934@gmail.com" className="hover:text-white underline">
                salman545934@gmail.com
              </a>
            </p>
          </div>

          <div className="space-y-2.5">
            <h5 className="text-white font-bold uppercase tracking-wider text-xs">Quality &amp; Compliance</h5>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold">FSSAI Status</p>
                <p className="text-slate-400 mt-0.5">Registration Applied / In Process</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 py-4 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} SK Premium Superfoods. All rights reserved.
        </div>
      </footer>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" /> Your Cart
              </h3>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setOrderSuccessId(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {orderSuccessId ? (
                <div className="text-center py-10 space-y-3">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
                  <h4 className="text-xl font-extrabold text-slate-900">Order Placed! (#{orderSuccessId})</h4>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    Aapka order SK Premium Superfoods ko mil gaya hai. Jaise hi owner order accept karenge, aapko WhatsApp par confirmation message aa jayega!
                  </p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setOrderSuccessId(null);
                    }}
                    className="mt-4 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm">Aapka cart abhi khali hai.</div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70"
                      >
                        <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{item.name}</h4>
                          {item.variant && <p className="text-[11px] text-slate-500">Option: {item.variant}</p>}
                          <p className="font-bold text-xs text-amber-700 mt-0.5">₹{item.price * item.qty}</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-1.5 py-1">
                          <button onClick={() => updateQty(idx, -1)} className="p-0.5">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(idx, 1)} className="p-0.5">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Delivery Charge</span>
                      <span>
                        {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${deliveryFee}`}
                      </span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
                      <span>Total Payable</span>
                      <span>₹{totalAmount}</span>
                    </div>
                  </div>

                  <form onSubmit={handlePlaceOrder} className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Delivery &amp; Payment</h4>
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs"
                    />
                    <input
                      type="tel"
                      placeholder="WhatsApp Mobile Number (10 digits) *"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs"
                    />
                    <textarea
                      placeholder="Complete Delivery Address & Pincode *"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      rows={2}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('COD')}
                        className={`py-2 rounded-xl text-xs font-bold border ${
                          paymentMethod === 'COD'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        Cash on Delivery
                      </button>
                      {settings?.upi_id && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('UPI')}
                          className={`py-2 rounded-xl text-xs font-bold border ${
                            paymentMethod === 'UPI'
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          Pay via UPI
                        </button>
                      )}
                    </div>

                    {paymentMethod === 'UPI' && settings?.upi_id && (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-2 text-xs">
                        <p className="font-semibold text-slate-800">
                          Is UPI ID par <span className="font-extrabold">₹{totalAmount}</span> pay karein:
                        </p>
                        <p className="font-mono bg-white px-2.5 py-1.5 rounded border border-amber-300 font-bold select-all">
                          {settings.upi_id}
                        </p>
                        <input
                          type="text"
                          placeholder="Payment ke baad UTR / Ref No. dalein *"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          required
                          className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition cursor-pointer"
                    >
                      {submitting ? 'Placing Order...' : `Confirm Order • ₹${totalAmount}`}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}