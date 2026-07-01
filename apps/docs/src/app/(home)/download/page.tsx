"use client";

import { useState } from "react";
import { FaApple, FaLinux, FaWindows, FaRegCopy } from "react-icons/fa";

const COMMANDS = {
  macos: "curl -fsSL https://tile.js.org/installer/cli/install.sh | sh",
  linux: "curl -fsSL https://tile.js.org/installer/cli/install.sh | sh",
  windows: "irm https://tile.js.org/installer/cli/install.ps1 | iex",
} as const;

type Platform = keyof typeof COMMANDS;

export default function Page() {
  const [platform, setPlatform] = useState<Platform>("linux");

  const command = COMMANDS[platform];

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      // ignore
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center px-6 py-20">
      <h1 className="mb-10 text-center text-5xl font-semibold tracking-tight">
        Download Tile
      </h1>

      <div className="mb-12 flex flex-wrap items-center justify-center gap-4">
        <PlatformButton
          active={platform === "macos"}
          icon={<FaApple className="size-7" />}
          label="macOS"
          onClick={() => setPlatform("macos")}
        />

        <PlatformButton
          active={platform === "linux"}
          icon={<FaLinux className="size-7" />}
          label="Linux"
          onClick={() => setPlatform("linux")}
        />

        <PlatformButton
          active={platform === "windows"}
          icon={<FaWindows className="size-7" />}
          label="Windows"
          onClick={() => setPlatform("windows")}
        />
      </div>

      <div className="flex w-full max-w-xl items-center overflow-hidden rounded-xl border">
        <code className="flex-1 overflow-x-auto whitespace-nowrap px-5 py-4 font-mono text-sm">
          {command}
        </code>

        <button
          onClick={copy}
          className="border-l p-4 transition-opacity hover:opacity-70"
          aria-label="Copy command"
        >
          <FaRegCopy />
        </button>
      </div>

      {/*<div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-fd-muted-foreground">
        <a
          href="https://tile.js.org/install.sh"
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          View install script
        </a>
      </div>*/}
    </main>
  );
}

interface PlatformButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick(): void;
}

function PlatformButton({ active, icon, label, onClick }: PlatformButtonProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex w-32 flex-col items-center rounded-xl border px-6 py-5 transition-all duration-200",
        active ? "border-fd-primary" : "border-transparent hover:border-border",
      ].join(" ")}
    >
      {icon}

      <span className="mt-3">{label}</span>
    </button>
  );
}
