import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "PulseMap — Global Disease Radar",
    description: "Real-time global disease surveillance dashboard. Track outbreaks, monitor spread patterns, and stay informed with PulseMap.",
    keywords: ["disease tracking", "outbreak map", "health surveillance", "epidemic radar"],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zn-CN" className="dark">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
