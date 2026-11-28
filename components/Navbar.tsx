'use client';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export default function Navbar({ cartCount, onOpenCart }: { cartCount: number; onOpenCart: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-amber-600 flex items-center justify-center shadow-md group-hover:scale-105 transition">
            <span className="text-white font-extrabold text-lg tracking-tighter">
              S<span className="text-amber-400">K</span>
            </span>
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base sm:text-lg leading-none tracking-tight">
              SK Premium Superfoods
            </h1>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              100% Natural | Pure &amp; Homemade
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
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
