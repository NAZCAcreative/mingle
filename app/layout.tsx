import type { Metadata } from "next";
import { Black_Han_Sans, Do_Hyeon, Gugi, IBM_Plex_Sans_KR } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const gugi = Gugi({ weight: "400", subsets: ["latin"], variable: "--font-gugi" });
const blackHanSans = Black_Han_Sans({ weight: "400", subsets: ["latin"], variable: "--font-black-han" });
const doHyeon = Do_Hyeon({ weight: "400", subsets: ["latin"], variable: "--font-dohyeon" });
const plexSansKr = IBM_Plex_Sans_KR({ weight: ["300", "400"], subsets: ["latin"], variable: "--font-plex-kr" });

export const metadata: Metadata = {
  title: "교류방",
  description: "대화가 모임이 되는 순간"
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
