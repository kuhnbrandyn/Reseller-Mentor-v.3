"use client"; // 👈 Add this line at the top!

import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import { usePathname } from "next/navigation";

export const metadata = {
  title: "Reseller Mentor AI",
  description: "AI tools and guidance for live resellers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showChat = pathname === "/signup"; // Only show chat on signup

  return (
    <html lang="en">
      <body className="bg-black text-white">
        {children}
        {showChat && <ChatWidget context="SignUpPage" />}
      </body>
    </html>
  );
}
