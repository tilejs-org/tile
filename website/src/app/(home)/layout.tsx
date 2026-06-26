import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/lib/layout.shared";
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
import { Book, DatabaseIcon, Pencil, RocketIcon, Server } from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "TileJS — Ecossistema moderno para desenvolvedores",
    template: "%s | TileJS",
  },
  description:
    "TileJS é um ecossistema moderno de ferramentas, database tipada e APIs rápidas para desenvolvedores que querem velocidade sem complexidade.",
  applicationName: "TileJS",
  keywords: [
    "TileJS",
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

  metadataBase: new URL("https://tilejs.vercel.app"),

  openGraph: {
    title: "TileJS — Ecossistema moderno para desenvolvedores",
    description:
      "Database tipada, ferramentas modernas e APIs rápidas para construir o futuro com velocidade e simplicidade.",
    url: "https://tilejs.vercel.app",
    siteName: "TileJS",
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
          text: "Documentation",
          items: [
            {
              text: "Documentação",
              url: "/docs",
              icon: <Book />,
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
                      alt="Preview do TileJS"
                      className="rounded-t-lg object-cover"
                      style={{
                        maskImage:
                          "linear-gradient(to bottom, white 60%, transparent)",
                      }}
                    />
                  </div>

                  <p className="font-medium">Introdução</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Conheça o TileJS, explore seus pacotes e descubra como criar
                    aplicações modernas utilizando TypeScript e Bun.
                  </p>
                </NavbarMenuLink>
                <NavbarMenuLink
                  href="/docs/database/get-started"
                  className="lg:col-start-2"
                >
                  <DatabaseIcon className="bg-fd-info/50 text-fd-primary-foreground mb-2 rounded-md p-1" />

                  <p className="font-medium">Database</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Banco de dados local tipado com schemas, coleções e
                    persistência para aplicações rápidas e escaláveis.
                  </p>
                </NavbarMenuLink>
                <NavbarMenuLink
                  href="/docs/database/installation"
                  className="lg:col-start-2"
                >
                  <Server className="bg-fd-info/50 text-fd-primary-foreground mb-2 rounded-md p-1" />

                  <p className="font-medium">Instalação</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Instale o TileJS Database no seu projeto
                  </p>
                </NavbarMenuLink>
                <NavbarMenuLink
                  href="/docs/database/collections"
                  className="lg:col-start-3 lg:row-start-1"
                >
                  <Pencil className="bg-fd-info/50 text-fd-primary-foreground mb-2 rounded-md p-1" />

                  <p className="font-medium">Collections</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Crie e gerencie Collections utilizando Schemas
                  </p>
                </NavbarMenuLink>
                <NavbarMenuLink
                  href="/docs/database/crud"
                  className="lg:col-start-3 lg:row-start-2"
                >
                  <RocketIcon className="bg-fd-info/50 text-fd-primary-foreground mb-2 rounded-md p-1" />

                  <p className="font-medium">CRUD</p>
                  <p className="text-fd-muted-foreground text-sm">
                    Explore um projeto completo utilizando os principais
                    recursos do TileJS como ponto de partida.
                  </p>
                </NavbarMenuLink>
              </NavbarMenuContent>
            </NavbarMenu>
          ),
        },
        // ...linkItems,
      ]}
      className="dark:bg-neutral-950 dark:[--color-fd-background:var(--color-neutral-950)] [--color-fd-primary:var(--color-brand)]"
    >
      {children}
    </HomeLayout>
  );
}
