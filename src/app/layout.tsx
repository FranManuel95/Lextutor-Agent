import type { Metadata } from "next";
import { Inter, Crimson_Pro } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
    subsets: ["latin"],
    display: 'swap',
    variable: '--font-inter'
});

const crimsonPro = Crimson_Pro({
    subsets: ["latin"],
    weight: ['400', '600', '700'],
    style: ['normal', 'italic'],
    display: 'swap',
    variable: '--font-crimson'
});

export const metadata: Metadata = {
    title: "Estudiante Elite",
    description: "Tutor Jurídico Pedagógico con RAG",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    return (
        <html lang="es">
            <head>
                {supabaseUrl && (
                    <>
                        <link rel="preconnect" href={supabaseUrl} />
                        <link rel="dns-prefetch" href={supabaseUrl} />
                    </>
                )}
            </head>
            <body className={`${inter.variable} ${crimsonPro.variable} font-sans`}>
                {children}
                <Toaster />
            </body>
        </html>
    );
}
