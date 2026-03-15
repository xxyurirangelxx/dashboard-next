import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Créditos • Dashboard PRO",
  description: "Dashboard PRO para análise de créditos, vales e comprometimento salarial de funcionários.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Dynamic font link for user-configurable fonts; next/font handles the default Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- Dynamic font link for runtime font switching from Aparência page */}
        <link
          id="google-font-link"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
