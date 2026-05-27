import type { Metadata } from 'next';
import './globals.css';
import { ToastHost } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: {
    default: 'Equmanager',
    template: '%s · Equmanager',
  },
  description:
    'Plataforma todo-en-uno para hípicas, propietarios, mozos y alumnos. Clases, eventos, cuidados, bonos e IA en un mismo sitio.',
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-stone-50 font-sans text-stone-900">
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
