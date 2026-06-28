import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/components/layouts/shared";
import { IoMdBookmarks } from "react-icons/io";
import {
  NavbarMenu,
  NavbarMenuContent,
  NavbarMenuLink,
  NavbarMenuTrigger,
} from "fumadocs-ui/layouts/home/navbar";
import Link from "fumadocs-core/link";
import Image from "next/image";
import Preview from "../../../public/images/package_database.png";
import {
  Book,
  Boxes,
  DatabaseIcon,
  RocketIcon,
  Server,
} from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Tile.JS — Ecossistema moderno para desenvolvedores",
    template: "%s | Tile.JS",
  },
  description:
    "Tile.JS é um ecossistema moderno de ferramentas, database tipada e APIs rápidas para desenvolvedores que querem velocidade sem complexidade.",
  applicationName: "Tile.JS",
  keywords: [
    "Tile.JS",
    "database tipada",
    "TypeScript database",
    "developer tools",
    "backend moderno",
    "API rápida",
    "ecossistema dev",
    "DX",
    "low overhead",
  ],
  authors: [{ name: "Israel R. Jatobá" }],

  metadataBase: new URL("https://tile.js.org"),

  openGraph: {
    title: "Tile.JS — Ecossistema moderno para desenvolvedores",
    description:
      "Database tipada, ferramentas modernas e APIs rápidas para construir o futuro com velocidade e simplicidade.",
    url: "https://tile.js.org",
    siteName: "Tile.JS",
    type: "website",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "technology",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <HomeLayout
      {...baseOptions()}
      links={[
        {
          type: "menu",
          on: "menu",
          text: "Documentação",
          items: [
            {
              text: "Visão geral",
              url: "/docs",
              icon: <Book />,
            },
            {
              text: "Get started",
              url: "/docs/get-started",
              icon: <DatabaseIcon />,
            },
            {
              text: "Instalação",
              url: "/docs/installation",
              icon: <Server />,
            },
            {
              text: "Adapters",
              url: "/docs/adapters",
              icon: <Boxes />,
            },
            {
              text: "CRUD",
              url: "/docs/crud",
              icon: <RocketIcon />,
            },
          ],
        },
        {
          type: "custom",
          on: "nav",
          children: (
            <NavbarMenu>
              <NavbarMenuTrigger>
                <Link
                  href="/docs"
                  className="flex items-center gap-2 font-bold"
                >
                  <IoMdBookmarks />
                  <span>Documentação</span>
                </Link>
              </NavbarMenuTrigger>
              <NavbarMenuContent>
                <NavbarMenuLink href="/docs" className="md:row-span-2">
                  <div className="-mx-3 -mt-3">
                    <Image
                      src={Preview}
                      alt="Preview da documentação do Tile.JS Database"
                      className="rounded-t-lg object-cover"
                      style={{
                        maskImage:
                          "linear-gradient(to bottom, white 60%, transparent)",
                      }}
                    />
                  </div>

                  <p className="font-medium">Comece pela documentação</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Explore o Tile.JS e comece pela área mais madura do projeto:
                    a documentação do @tile.js/database.
                  </p>
                </NavbarMenuLink>
                <NavbarMenuLink
                  href="/docs/get-started"
                  className="lg:col-start-2"
                >
                  <DatabaseIcon className="bg-fd-info/50 text-fd-primary-foreground mb-2 rounded-md p-1" />

                  <p className="font-medium">Get started</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Entenda a proposta da lib e faça o primeiro setup em poucos
                    minutos.
                  </p>
                </NavbarMenuLink>
                <NavbarMenuLink
                  href="/docs/installation"
                  className="lg:col-start-2"
                >
                  <Server className="bg-fd-info/50 text-fd-primary-foreground mb-2 rounded-md p-1" />

                  <p className="font-medium">Instalação</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Instale o pacote principal e veja quando adicionar adapters
                    opcionais.
                  </p>
                </NavbarMenuLink>
                <NavbarMenuLink
                  href="/docs/adapters"
                  className="lg:col-start-3 lg:row-start-1"
                >
                  <Boxes className="bg-fd-info/50 text-fd-primary-foreground mb-2 rounded-md p-1" />

                  <p className="font-medium">Adapters</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Compare o adapter padrão, MongoDB e Mongoose no mesmo fluxo
                    de uso.
                  </p>
                </NavbarMenuLink>
                <NavbarMenuLink
                  href="/docs/crud"
                  className="lg:col-start-3 lg:row-start-2"
                >
                  <RocketIcon className="bg-fd-info/50 text-fd-primary-foreground mb-2 rounded-md p-1" />

                  <p className="font-medium">CRUD</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Veja a API real da collection com create, find, updateOne,
                    upsert, paginate e mais.
                  </p>
                </NavbarMenuLink>
              </NavbarMenuContent>
            </NavbarMenu>
          ),
        },
      ]}
      className="dark:bg-neutral-950 dark:[--color-fd-background:var(--color-neutral-950)] [--color-fd-primary:var(--color-brand)]"
    >
      {children}
    </HomeLayout>
  );
}
