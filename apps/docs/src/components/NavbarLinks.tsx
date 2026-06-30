"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { IoMdBook, IoMdDownload, IoMdMenu, IoMdClose } from "react-icons/io";

export function NavbarLinks() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isDocs = pathname.startsWith("/docs");
  const isDownload = pathname.startsWith("/download");

  const base =
    "flex items-center gap-2 px-3 py-1 rounded-full transition border";

  const active = "bg-neutral-900 text-white border-neutral-700";
  const inactive =
    "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40";

  const close = () => setOpen(false);

  return (
    <div className="flex items-center justify-between w-full">
      {/* DESKTOP */}
      <div className="hidden md:flex items-center gap-2 font-medium">
        <Link href="/docs" className={`${base} ${isDocs ? active : inactive}`}>
          <IoMdBook />
          Documentação
        </Link>

        <Link
          href="/download"
          className={`${base} ${isDownload ? active : inactive}`}
        >
          <IoMdDownload />
          Download
        </Link>
      </div>

      {/* MOBILE BUTTON */}
      <button
        className="md:hidden flex items-center text-2xl text-neutral-300"
        onClick={() => setOpen(!open)}
      >
        {open ? <IoMdClose /> : <IoMdMenu />}
      </button>

      {/* MOBILE MENU */}
      {open && (
        <div className="absolute top-14 left-0 w-full bg-neutral-950 border-t border-neutral-800 p-4 md:hidden">
          <div className="flex flex-col gap-2">
            <Link
              href="/docs"
              onClick={close}
              className={`${base} ${isDocs ? active : inactive}`}
            >
              <IoMdBook />
              Documentação
            </Link>

            <Link
              href="/download"
              onClick={close}
              className={`${base} ${isDownload ? active : inactive}`}
            >
              <IoMdDownload />
              Download
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}