"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navLinks = [
  { href: "/dashboard/ai-mentor", label: "AI Mentor" },
  { href: "/dashboard/vault", label: "Supplier Vault" },
  { href: "/dashboard/scams", label: "Avoid Scams" },
  { href: "/dashboard/business", label: "Business Setup" },
  { href: "/dashboard/sourcing", label: "Pro Sourcing Tips" },
  { href: "/dashboard/shipping", label: "Shipping Pallets" },
  { href: "/dashboard/supplier-analyzer", label: "Supplier Analyzer" }

];


  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-[#E4B343]/40 p-6 hidden md:flex flex-col">
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

      {/* Main content */}
      <main className="flex-1 p-8 flex flex-col justify-between">
        <div>{children}</div>

        {/* === GLOBAL FOOTER === */}
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

