import type { ReactNode } from "react";

type PageWidth = "wide" | "standard";

interface AppPageLayoutProps {
  width?: PageWidth;
  header?: ReactNode;
  children: ReactNode;
  className?: string;
}

const WIDTH_CLASS: Record<PageWidth, string> = {
  wide: "max-w-[1600px]",
  standard: "max-w-[1200px]",
};

export function AppPageLayout({
  width = "wide",
  header,
  children,
  className = "",
}: AppPageLayoutProps) {
  return (
    <div className="min-h-screen bg-corp-bg">
      {header}
      <main
        className={`mx-auto space-y-5 p-5 ${WIDTH_CLASS[width]} ${className}`.trim()}
      >
        {children}
      </main>
    </div>
  );
}
