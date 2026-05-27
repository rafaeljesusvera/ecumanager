import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  HorseIcon,
  CertificateIcon,
  GraduationCapIcon,
  ClipboardTextIcon,
} from '@phosphor-icons/react/dist/ssr';
import { getSessionOrRedirect } from '@/lib/db';
import { LogoMark } from '@/components/brand/Logo';
import { Button, Field, Input, Select } from '@/components/ui';
import { createClubAction, joinClubAction } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bienvenido' };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; error?: string }>;
}) {
  const session = await getSessionOrRedirect();
  if (session.primary) redirect('/app');

  const { as, error } = await searchParams;
  const choice = as ?? '';

  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-stone-50 to-stone-100">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <LogoMark size={36} />
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
          Bienvenido · {session.user.email}
        </p>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {!choice && <RoleChooser />}
        {choice === 'owner' && <OwnerForm />}
        {(choice === 'horse_owner' ||
          choice === 'rider' ||
          choice === 'groom') && <JoinForm preset={choice} />}
      </section>
    </main>
  );
}

function RoleChooser() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-900">
        ¿Quién entra por la puerta?
      </h1>
      <p className="mt-2 max-w-lg text-sm font-medium text-stone-600">
        Esto decide qué ves al entrar. Podrás cambiarlo o tener varios roles en
        distintas hípicas más adelante.
      </p>

      <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2">
        <RoleChip
          href="/onboarding?as=owner"
          icon={<HorseIcon size={28} weight="duotone" />}
          title="Soy propietario de hípica"
          text="Quiero gestionar mi club, dar de alta clases, eventos y bonos."
        />
        <RoleChip
          href="/onboarding?as=horse_owner"
          icon={<CertificateIcon size={28} weight="duotone" />}
          title="Soy propietario de un caballo"
          text="Quiero ver la agenda y los cuidados de mi caballo."
        />
        <RoleChip
          href="/onboarding?as=rider"
          icon={<GraduationCapIcon size={28} weight="duotone" />}
          title="Soy alumno o corredor"
          text="Quiero apuntarme a clases, ver eventos y mi afinidad."
        />
        <RoleChip
          href="/onboarding?as=groom"
          icon={<ClipboardTextIcon size={28} weight="duotone" />}
          title="Soy mozo de cuadra"
          text="Quiero el checklist diario de cada caballo asignado."
        />
      </div>

      <p className="mt-8 text-center text-xs font-medium text-stone-500">
        ¿Aún no sabes qué eres?{' '}
        <Link
          href="/help/como-empezar"
          className="font-bold uppercase tracking-[0.14em] text-brand-700 hover:text-brand-900"
        >
          Ver guía rápida
        </Link>
      </p>
    </div>
  );
}

function RoleChip({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-3xl border border-stone-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand-300"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          {icon}
        </div>
        <div>
          <h3 className="text-base font-bold text-stone-900">{title}</h3>
          <p className="mt-1 text-sm font-medium leading-relaxed text-stone-600">
            {text}
          </p>
        </div>
      </div>
    </Link>
  );
}

function OwnerForm() {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-7 shadow-soft">
      <Link
        href="/onboarding"
        className="mb-5 inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 hover:text-brand-700"
      >
        ← Cambiar perfil
      </Link>
      <h1 className="text-2xl font-bold text-stone-900">Crea tu hípica</h1>
      <p className="mt-1.5 max-w-md text-sm font-medium text-stone-600">
        Solo el nombre. Te creamos el espacio con plantillas listas para usar
        (mozos, cuidados, calendario).
      </p>

      <form action={createClubAction} className="mt-6 space-y-3">
        <Field
          label="Nombre de la hípica"
          hint="Lo verán tus alumnos y propietarios."
        >
          <Input
            required
            name="name"
            minLength={2}
            maxLength={120}
            placeholder="Hípica Valdebebas"
          />
        </Field>
        <Button type="submit" size="lg" className="w-full">
          Crear hípica y entrar
        </Button>
      </form>
    </div>
  );
}

function JoinForm({ preset }: { preset: 'horse_owner' | 'rider' | 'groom' }) {
  const presetLabels: Record<typeof preset, { title: string; subtitle: string }> = {
    horse_owner: {
      title: 'Únete como propietario de caballo',
      subtitle: 'Necesitas el código de la hípica de tu caballo.',
    },
    rider: {
      title: 'Únete como alumno',
      subtitle:
        'Pídele a tu profesor o a la hípica el código (lo tienen en su panel).',
    },
    groom: {
      title: 'Únete como mozo',
      subtitle:
        'Te aparecerá la lista de caballos asignados en cuanto la hípica te dé acceso.',
    },
  };
  const labels = presetLabels[preset];

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-7 shadow-soft">
      <Link
        href="/onboarding"
        className="mb-5 inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500 hover:text-brand-700"
      >
        ← Cambiar perfil
      </Link>
      <h1 className="text-2xl font-bold text-stone-900">{labels.title}</h1>
      <p className="mt-1.5 max-w-md text-sm font-medium text-stone-600">
        {labels.subtitle}
      </p>

      <form action={joinClubAction} className="mt-6 space-y-3">
        <Field
          label="Código de la hípica"
          hint="Lo identifica de forma única, todo en minúsculas (ej. hipica-valdebebas)."
        >
          <Input
            required
            name="slug"
            minLength={3}
            maxLength={40}
            placeholder="hipica-valdebebas"
            pattern="[a-z0-9][a-z0-9-]*"
          />
        </Field>
        <Field label="Voy a entrar como">
          <Select name="role" defaultValue={preset}>
            <option value="rider">Alumno / corredor</option>
            <option value="horse_owner">Propietario de caballo</option>
            <option value="groom">Mozo</option>
            <option value="instructor">Instructor</option>
          </Select>
        </Field>
        <Button type="submit" size="lg" className="w-full">
          Unirme a la hípica
        </Button>
      </form>
    </div>
  );
}
