import type { ReactNode } from "react";

interface InfoPanelProps {
  label: string;
  children: ReactNode;
}

export function InfoPanel({ label, children }: InfoPanelProps) {
  return (
    <div className="grid min-h-28 gap-2 rounded-lg border border-[#dfe4dc] bg-white p-[18px]">
      <span className="text-[13px] text-[#68766d]">{label}</span>
      <strong className="text-lg">{children}</strong>
    </div>
  );
}
