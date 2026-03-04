"use client";

import { useSplashText } from "./useSplashText";
import Image from "next/image";
import logo from "@/assets/branding/logo.png";

export default function SplashScreen() {
  const text = useSplashText("nl");

  return (
    <div className="min-h-screen bg-[#efe2da] text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-between px-8 py-14 text-center">
        <div />

        <div className="flex flex-col items-center">
          <Image
            src={logo}
            alt="Pure Therapeutic Art logo"
            className="h-auto w-40"
            priority
          />

          <h1 className="mt-4 font-serif text-4xl leading-[1.05] text-stone-800">
            Pure Grief
            <br />
            and
            <br />
            Therapeutic
            <br />
            ART
          </h1>

          <div
            className="mt-12 h-8 w-8 animate-spin rounded-full border-[3px] border-[#9fb29c] border-r-[#b13f37]"
            aria-label="Laden"
          />
        </div>

        <div className="pb-2">
          <p className="font-serif text-2xl leading-tight text-stone-900">
            &ldquo;Rust, groei en troost
            <br />
            in een plek&rdquo;
          </p>
          {text ? (
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-stone-500">
              {text}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
