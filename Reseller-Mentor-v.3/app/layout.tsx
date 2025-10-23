import "./globals.css";

export const metadata = {
  title: "Reseller Mentor AI",
  description: "AI tools and guidance for live resellers"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        {children}
      </body>
    </html>
  );
}
