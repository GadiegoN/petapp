"use client";

import Link from "next/link";
import { HeartHandshake, Map, PawPrint, QrCode, type LucideIcon } from "lucide-react";
import { RoleNavigation } from "@/components/navigation/role-navigation";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-fg">
      <RoleNavigation />

      <main className="mx-auto w-full max-w-260 px-4 py-8 sm:px-6">
        <section className="grid gap-8 py-8 lg:grid-cols-[1fr_24rem] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase text-accent">
              Mundo Pet Comunitario
            </p>
            <h1 className="mt-3 max-w-180 text-4xl font-black leading-tight text-white sm:text-5xl">
              Cadastro, cuidado e apoio para caes de rua e parceiros pet.
            </h1>
            <p className="mt-5 max-w-170 text-base leading-7 text-muted">
              Consulte o mapa publico, identifique animais por QR Code e ajude
              a comunidade a acompanhar pontos de alimentacao, agua e apoio.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/mapa"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-black uppercase text-accent-contrast transition hover:bg-accent-2"
              >
                <Map className="size-4" strokeWidth={2.2} />
                Ver mapa
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-bd-muted bg-surface-2 px-4 text-sm font-bold uppercase text-fg transition hover:border-accent hover:text-accent"
              >
                <PawPrint className="size-4" strokeWidth={2.2} />
                Entrar
              </Link>
            </div>
          </div>

          <section className="rounded-lg border border-bd-muted bg-surface p-5">
            <h2 className="text-base font-bold text-white">Acessos publicos</h2>
            <div className="mt-4 grid gap-3">
              <HomeCard
                href="/mapa"
                icon={Map}
                title="Mapa comunitario"
                description="Caes cadastrados, pontos de agua, alimentacao, apoio e doacao."
              />
              <HomeCard
                href="/mapa"
                icon={HeartHandshake}
                title="Apoio comunitario"
                description="Veja locais e parceiros que ajudam animais de rua."
              />
              <HomeCard
                href="/login"
                icon={QrCode}
                title="Area autenticada"
                description="Administradores, parceiros e voluntarios entram com Google."
              />
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function HomeCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-bd-muted bg-surface-3 p-4 transition hover:border-accent"
    >
      <span className="mb-3 grid size-9 place-items-center rounded-md bg-surface-2 text-accent">
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
    </Link>
  );
}
