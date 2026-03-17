import React from "react";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-full w-full">{children}</div>;
}
