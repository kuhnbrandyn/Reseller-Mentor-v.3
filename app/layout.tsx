import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import { usePathname } from "next/navigation";

export const metadata = {
  title: "Reseller Mentor AI",
  description: "AI tools and guidance for live resellers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // 👇 Dynamically detect current route
  const pathname = usePathname();

  // 👇 Only show chat on signup (and optionally terms)
  const showChat = pathname === "/signup" || pathname === "/terms";

  return (
    <html lang="en">
      <body className="bg-black text-white">
        {children}
        {showChat && <ChatWidget context="SignUpPage" />}
      </body>
    </html>
  );
}

