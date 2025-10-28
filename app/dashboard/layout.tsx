"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react"; // icons for open/close

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard/ai-mentor", label: "AI Mentor" },
    { href: "/dashboard/vault", label: "Supplier Vault" },
    { href: "/dashboard/scams", label: "Avoid Scams" },
    { href: "/dashboard/business", label: "Business Setup" },
    { href: "/dashboard/sourcing", label: "Pro Sourcing Tips" },
    { href: "/dashboard/shipping", label: "Shipping Pallets" },
    { href: "/dashboard/supplier-analyzer", label: "Website Scam Assist" },
    { href: "/dashboard/supply-list", label: "Supply List" },
  ];

  return (
    <div className="flex min-h-screen bg-black text-white relative">
      {/* === Sidebar (Desktop) === */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-[#E4B343]/40 p-6 hidden md:flex flex-col fixed h-full">
        <h2 className="text-2xl font-bold text-[#E4B343] mb-10">Dashboard</h2>
        <nav className="flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-gray-300 hover:text-[#E4B343] transition ${
                pathname === link.href ? "text-[#E4B343] font-semibold" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* === Mobile Top Bar === */}
      <div className="md:hidden w-full bg-[#0A0A0A] border-b border-[#E4B343]/40 flex items-center justify-between px-4 py-3 fixed top-0 left-0 z-50">
        <h2 className="text-lg font-bold text-[#E4B343]">Dashboard</h2>
        <button onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* === Mobile Slide-Out Menu === */}
      <div
        className={`md:hidden fixed top-0 left-0 w-64 h-full bg-[#0A0A0A] border-r border-[#E4B343]/40 transform transition-transform duration-300 z-40 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-[#E4B343] mb-6">Menu</h2>
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`text-gray-300 hover:text-[#E4B343] transition ${
                  pathname === link.href ? "text-[#E4B343] font-semibold" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* === Main content === */}
      <main className="flex-1 p-6 md:ml-64 pt-16 md:pt-8">
        <div>{children}</div>

        {/* Footer */}
        <footer className="text-center text-gray-400 mt-12 pb-6 text-sm border-t border-gray-800 pt-4">
          <p>
            Contact:{" "}
            <a
              href="mailto:support@myresellermentor.com"
              className="text-[#E4B343] hover:underline"
            >
              support@myresellermentor.com
            </a>
          </p>
          <p className="mt-1">
            &copy; {new Date().getFullYear()} My Reseller Mentor. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}

