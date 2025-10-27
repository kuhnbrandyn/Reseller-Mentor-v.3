"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ChatWidget from "@/components/ChatWidget";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showChat = pathname === "/signup"; // Only show chat on signup
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // ✅ Prevent footer from flashing before hydration
    setMounted(true);
  }, []);

  return (
    <>
      {children}
      {showChat && <ChatWidget context="SignUpPage" />}

      {/* === GLOBAL FOOTER === */}
      {mounted && (
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
      )}
    </>
  );
}

