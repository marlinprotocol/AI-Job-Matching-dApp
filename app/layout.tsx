import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Decentralized Job Marketplace",
  description: "A decentralized job marketplace with dynamic O(n²) matching",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="container mx-auto p-4">
          {children}
        </main>
        <footer className="bg-slate-800 text-white p-4 mt-8">
          <div className="container mx-auto text-center">
            <p>© {new Date().getFullYear()} Decentralized Job Marketplace. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
} 