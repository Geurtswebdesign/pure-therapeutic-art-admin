import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/branding/logo.png";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-8 py-16 text-center sm:px-16">
        <Image
          src={logo}
          alt="Pure Therapeutic ART logo"
          width={120}
          height={120}
          priority
        />
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-black">Welkom bij Pure Therapeutic ART</h1>
          <p className="text-zinc-700">
            Ontdek opdrachten en content die je stap voor stap ondersteunen.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            className="rounded bg-black px-5 py-2 text-white"
            href="/content"
          >
            Bekijk content
          </Link>
          <Link
            className="rounded border border-black px-5 py-2 text-black"
            href="/login"
          >
            Inloggen
          </Link>
        </div>
      </main>
    </div>
  );
}
