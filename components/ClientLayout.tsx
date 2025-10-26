"use client";

import { usePathname } from "next/navigation";
import ChatWidget from "@/components/ChatWidget";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showChat = pathname === "/signup"; // Only show chat on signup

  return (
    <>
      {children}
      {showChat && <ChatWidget context="SignUpPage" />}
    </>
  );
}
