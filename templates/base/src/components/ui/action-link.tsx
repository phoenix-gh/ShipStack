import type { AnchorHTMLAttributes, ReactNode } from "react";

type ActionLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
};

export function ActionLink({
  children,
  className = "",
  ...props
}: ActionLinkProps) {
  return (
    <a
      className={`inline-flex min-h-10 items-center rounded-md border border-[#cfd8d2] bg-white px-4 text-sm font-semibold text-[#17211b] no-underline transition-colors hover:border-[#9fb0a6] hover:bg-[#f1f4ef] ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
