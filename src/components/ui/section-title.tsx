import type { ReactNode } from "react";
import { BrushUnderline } from "./brush-underline";

/*
  DESIGN.md section 3: section titles are Poppins 900, uppercase, with the
  brush underline sitting under the second half of the words.
*/
export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative inline-block ${className}`}>
      <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-black uppercase tracking-[-0.01em] text-onyx">
        {children}
      </h2>
      <BrushUnderline className="absolute -bottom-1.5 left-1/2 h-2 w-1/2 text-highlight" />
    </div>
  );
}