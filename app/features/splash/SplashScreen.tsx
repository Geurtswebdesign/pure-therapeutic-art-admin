"use client";

import { useSplashText } from "./useSplashText";
import Image from "next/image";
import logo from "@/app/assets/branding/logo.png";

export default function SplashScreen() {
  const text = useSplashText("nl");

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <Image
          src={logo}
          alt="Pure Therapeutic Art logo"
          className="h-auto w-36"
          priority
        />

        <h1 className="mt-6 text-3xl font-semibold leading-tight tracking-wide">
          Pure Grief
          <br />
          and
          <br />
          Therapeutic ART
        </h1>

        <div
          className="mt-6 h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700"
          aria-label="Loading"
        />
      </div>

      {text && (
        <p className="px-6 pb-10 text-center text-sm text-gray-600">
          “{text}”
        </p>
      )}
    </div>
  );
}
