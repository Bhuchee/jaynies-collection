import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { CartSync } from "@/components/cart/cart-sync";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { auth } from "@/auth";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jaynie's Collection",
  description:
    "Handmade ready-to-wear, hoodie sets and Ankara pieces by Jaynie. Cut and sewn to order in Nigeria.",
};

/* FRD F5: the root layout resolves the session so CartSync knows whether to
   merge the guest cart into the saved cart or to stay purely local. */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white font-sans text-onyx">
        <CartSync userId={session?.user?.id ?? null} />
        <SiteHeader />
        {/* FRD F1: content gets bottom padding so the fixed nav never hides it. */}
        <div className="flex flex-1 flex-col pb-16 md:pb-0">{children}</div>
        <SiteFooter />
        <MobileBottomNav />
      </body>
    </html>
  );
}