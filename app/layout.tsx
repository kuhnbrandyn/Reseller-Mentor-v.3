import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata = {
  title: "Reseller Mentor AI",
  description: "AI tools and guidance for live resellers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <ClientLayout>{children}</ClientLayout>

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
      </body>
    </html>
  );
}

