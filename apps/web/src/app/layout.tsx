import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Equmanager',
    template: '%s · Equmanager',
  },
  description:
    'Sistema de gestión integral para clubes ecuestres: caballos, jinetes, clases e insignias.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
