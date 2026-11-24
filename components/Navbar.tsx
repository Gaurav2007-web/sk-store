'use client';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck } from 'lucide-react';

export default function Navbar({ cartCount, onOpenCart }: { cartCount: number; onOpenCart: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-amber-600 flex items-center justify-center shadow-md group-hover:scale-105 transition">
            <span className="text-white font-extrabold text-lg tracking-tighter">
              S<span className="text-amber-400">K</span>
            </span>
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg leading-none tracking-tight">SK Store</h1>
            <p className="text-[11px] text-slate-500 font-medium">Quality & Trust</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>

          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}