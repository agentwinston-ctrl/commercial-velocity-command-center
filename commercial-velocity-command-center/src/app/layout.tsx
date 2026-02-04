import type { Metadata } from "next";
import "./globals.css";
import SidebarNav from "@/components/SidebarNav";
import TopBar from "@/components/TopBar";

export const metadata: Metadata = {
  title: "Commercial Velocity Command Center",
  description: "Operator OS for Commercial Rev Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <TopBar />
        <div className="mx-auto flex max-w-6xl">
          <SidebarNav />
          <main className="w-full px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
