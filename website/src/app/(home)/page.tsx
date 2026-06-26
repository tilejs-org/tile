import { Icon } from "@/widgets/Icon";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    default: "TileJS — Ecossistema moderno para desenvolvedores",
    template: "%s | TileJS",
  },

  metadataBase: new URL("https://tilejs.vercel.app"),
};

export default function Page() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-6">
          <Icon animation="typing" />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-black tracking-[-0.04em] leading-tight">
          O ecossistema para
          <br />
          construir o futuro do <span className="text-primary">TileJS</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 max-w-xl  text-sm md:text-base">
          Um ecossistema moderno de ferramentas, database tipada e APIs rápidas
          para desenvolvedores que querem velocidade sem complexidade.
        </p>

        {/* Actions */}
        <div className="mt-8 flex items-center gap-4">
          <Link
            href="/docs"
            className="rounded-lg bg-black text-white dark:bg-white dark:text-black px-5 py-2 text-sm font-medium hover:opacity-80 transition"
          >
            Começar
          </Link>

          <Link
            href="/docs/database/get-started"
            className="rounded-lg border border-black/20 dark:border-white/20 px-5 py-2 text-sm font-medium hover:bg-black/10 dark:hover:bg-white/10 transition"
          >
            Database
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl w-full">
          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-5 text-left">
            <p className="font-semibold">⚡ Rápido</p>
            <p className="text-sm mt-2">
              Performance extrema com foco em DX e execução local.
            </p>
          </div>

          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-5 text-left">
            <p className="font-semibold">🧠 Tipado</p>
            <p className="text-sm mt-2">
              Schema-first com segurança total em TypeScript.
            </p>
          </div>

          <div className="rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-5 text-left">
            <p className="font-semibold">🧩 Modular</p>
            <p className="text-sm mt-2">
              Use apenas o que precisa — sem overhead.
            </p>
          </div>
        </div>

        {/* Footer hint */}
        <p className="mt-16 text-xs text-black/30 dark:text-white/30">
          TileJS • build faster, think simpler
        </p>
      </div>
    </main>
  );
}
