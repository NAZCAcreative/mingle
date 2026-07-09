import type { Metadata } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/Header";
import "./globals.css";

const gugi = localFont({
  src: "./fonts/Gugi-Regular.ttf",
  weight: "400",
  variable: "--font-gugi"
});
const blackHanSans = localFont({
  src: "./fonts/BlackHanSans-Regular.ttf",
  weight: "400",
  variable: "--font-black-han"
});
const doHyeon = localFont({
  src: "./fonts/DoHyeon-Regular.ttf",
  weight: "400",
  variable: "--font-dohyeon"
});
const plexSansKr = localFont({
  src: [
    { path: "./fonts/IBMPlexSansKR-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/IBMPlexSansKR-Regular.ttf", weight: "400", style: "normal" }
  ],
  variable: "--font-plex-kr"
});

export const metadata: Metadata = {
  title: "교류방",
  description: "대화가 모임이 되는 순간",
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${gugi.variable} ${blackHanSans.variable} ${doHyeon.variable} ${plexSansKr.variable}`}>
      <body>
        <div className="mobile-shell">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
