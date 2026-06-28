import { Icon } from "@/widgets/Icon";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Preview from "../../../public/images/package_database.png";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  DatabaseIcon,
  PlugZap,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

export const metadata: Metadata = {
  title: {
    default: "Tile.JS — Ecossistema moderno para desenvolvedores",
    template: "%s | Tile.JS",
  },
  description:
    "Tile.JS é um ecossistema moderno para desenvolvedores, com foco atual em database tipada, adapters e documentação clara para projetos Node.js e Bun.",
  metadataBase: new URL("https://tile.js.org"),
};

const highlights = [
  {
    title: "Schema-first e tipado",
    description:
      "Defina a estrutura dos dados uma vez e trabalhe com inferência forte no dia a dia.",
    icon: ShieldCheck,
  },
  {
    title: "Adapters reais",
    description:
      "Use o backend padrão da lib ou conecte MongoDB e Mongoose sem dependência runtime interna obrigatória.",
    icon: PlugZap,
  },
  {
    title: "API simples para produção",
    description:
      "CRUD, paginação, schema, índices e lifecycle com uma API pequena e consistente.",
    icon: Workflow,
  },
];

const quickLinks = [
  {
    title: "Get started",
    description: "Entenda a proposta da lib e faça o primeiro setup em poucos minutos.",
    href: "/docs/get-started",
    icon: Rocket,
  },
  {
    title: "Instalação",
    description: "Instale o pacote principal e veja quando adicionar adapters opcionais.",
    href: "/docs/installation",
    icon: Server,
  },
  {
    title: "Adapters",
    description: "Compare o adapter padrão, MongoDB e Mongoose no mesmo fluxo de uso.",
    href: "/docs/adapters",
    icon: Boxes,
  },
  {
    title: "CRUD",
    description: "Veja a superfície real da collection e os métodos disponíveis.",
    href: "/docs/crud",
    icon: DatabaseIcon,
  },
];

export default function Page() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_color-mix(in_oklab,_var(--color-fd-primary)_12%,_transparent)_0%,_transparent_55%)]" />

      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-6 py-20 md:py-24">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-medium dark:border-white/10 dark:bg-white/5">
              <Sparkles className="size-3.5" />
              <span>@tile.js/database já disponível</span>
            </div>

            <div className="mb-6">
              <Icon animation="typing" />
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.04em] md:text-6xl">
              O ecossistema <span className="text-primary">Tile.JS</span> para
              construir backends tipados, rápidos e sem excesso.
            </h1>

            <p className="mt-6 max-w-2xl text-base text-black/70 dark:text-white/70 md:text-lg">
              Hoje o foco principal está no <strong>@tile.js/database</strong>: uma
              lib schema-first com adapter padrão local em BSON e suporte a
              adapters para <strong>MongoDB</strong> e <strong>Mongoose</strong>,
              pensada para projetos em <strong>Node.js</strong> e <strong>Bun</strong>.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/docs/get-started"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-85 dark:bg-white dark:text-black"
              >
                Ler documentação
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href="/docs/installation"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/15 px-5 py-3 text-sm font-semibold transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
              >
                Instalar agora
              </Link>

              <Link
                href="/docs"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent px-5 py-3 text-sm font-medium text-black/70 transition hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5"
              >
                Explorar docs
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-black/65 dark:text-white/65">
              <div className="rounded-full border border-black/10 bg-black/5 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
                Adapter padrão local
              </div>
              <div className="rounded-full border border-black/10 bg-black/5 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
                MongoDB e Mongoose opcionais
              </div>
              <div className="rounded-full border border-black/10 bg-black/5 px-3 py-1.5 dark:border-white/10 dark:bg-white/5">
                Node.js 24+ e Bun
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-white/70 shadow-2xl shadow-black/5 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
              <div className="border-b border-black/10 px-5 py-4 dark:border-white/10">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <DatabaseIcon className="size-4 text-primary" />
                  <span>Pacote em destaque</span>
                </div>
                <p className="mt-1 text-sm text-black/65 dark:text-white/65">
                  O database organiza a persistência em adapters e mantém a semântica principal da lib no core.
                </p>
              </div>

              <div className="p-4">
                <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
                  <Image
                    src={Preview}
                    alt="Preview da documentação do pacote @tile.js/database"
                    className="h-auto w-full object-cover"
                    priority
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-sm font-semibold">O que já está pronto</p>
                    <p className="mt-2 text-sm text-black/65 dark:text-white/65">
                      Schema, collections, CRUD, paginação, lifecycle e documentação atualizada.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-black/[0.03] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-sm font-semibold">Por que começar aqui</p>
                    <p className="mt-2 text-sm text-black/65 dark:text-white/65">
                      Hoje esta é a área mais madura do ecossistema e o melhor ponto de entrada para entender o Tile.JS.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-8">
        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map(({ title, description, icon: IconComponent }) => (
            <article
              key={title}
              className="rounded-2xl border border-black/10 bg-black/[0.03] p-6 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="mb-4 inline-flex rounded-xl border border-black/10 bg-white/80 p-2 dark:border-white/10 dark:bg-white/10">
                <IconComponent className="size-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-black/70 dark:text-white/70">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-primary">
              <BookOpen className="size-4" />
              Comece pelo que já está estável
            </p>
            <h2 className="text-3xl font-black tracking-[-0.03em]">
              Rotas rápidas para entender o produto
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-black/70 dark:text-white/70 md:text-base">
              Se você está chegando agora no Tile.JS, a melhor experiência hoje é começar pela documentação do database e seguir o fluxo oficial da lib.
            </p>
          </div>

          <Link
            href="/docs/get-started"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            Abrir guia principal
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map(({ title, description, href, icon: IconComponent }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-2xl border border-black/10 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
            >
              <div className="mb-4 inline-flex rounded-xl border border-black/10 bg-black/[0.03] p-2 dark:border-white/10 dark:bg-white/[0.05]">
                <IconComponent className="size-5 text-primary" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-black/70 dark:text-white/70">
                {description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Acessar
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
