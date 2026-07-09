import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mingle",
  description: "대화가 모임이 되는 순간"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <div className="mobile-shell">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
