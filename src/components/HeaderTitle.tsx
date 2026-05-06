"use client";

import { usePathname } from "next/navigation";

const TITLES: Array<[RegExp, string]> = [
  [/^\/dashboard/, "Dashboard"],
  [/^\/clients\//, "Client Profile"],
  [/^\/circulars\/[^/]+\/impact/, "Client Impact Analysis"],
  [/^\/circulars\/[^/]+/, "Circular Detail"],
  [/^\/circulars/, "Circulars"],
  [/^\/comms\//, "Compliance Advisory"],
  [/^\/calendar/, "Compliance Calendar"],
];

export default function HeaderTitle() {
  const pathname = usePathname() ?? "/";
  for (const [pattern, title] of TITLES) {
    if (pattern.test(pathname)) return <span className="header-title">{title}</span>;
  }
  return <span className="header-title">Ask CA</span>;
}
