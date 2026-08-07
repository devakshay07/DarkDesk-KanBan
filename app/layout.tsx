import type { Metadata } from "next";
import { AuthProvider } from "../components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = { title: "DarkDesk", description: "A focused personal Kanban workspace" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
