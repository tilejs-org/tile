import { RootProvider } from 'fumadocs-ui/provider/next';
import { Banner } from 'fumadocs-ui/components/banner';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { IoRocketSharp } from 'react-icons/io5';

import './global.css';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Banner
          height="30px"
          variant="rainbow"
          rainbowColors={[
            'rgba(0,120,255,0.4)',
            'transparent',
            'rgba(0,120,255,0.4)',
            'transparent',
            'rgba(0,120,255,0.4)',
            'transparent',
          ]}
        >
          <Link
            href="/docs/database/get-started"
            className="flex h-full items-center justify-center gap-1.5 px-2 text-[11px] font-medium transition hover:opacity-90 sm:gap-2 sm:px-3 sm:text-xs"
          >
            <IoRocketSharp className="size-3.5 shrink-0" />
            <span className="hidden sm:inline">@tile.js/database</span>
            <span className="rounded-full border border-black/10 bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold leading-none dark:border-white/10 dark:bg-white/10">
              v1.1
            </span>
            <span className="rounded-full border border-black/10 bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold leading-none dark:border-white/10 dark:bg-white/10">
              adapters
            </span>
            <span className="hidden md:inline text-black/70 dark:text-white/70">
              release disponível — abrir documentação
            </span>
          </Link>
        </Banner>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
