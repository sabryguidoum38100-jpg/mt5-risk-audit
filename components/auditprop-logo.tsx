import type { SVGProps } from "react";

export default function AuditPropLogo({ className = "h-8 w-8", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-label="AuditProp" role="img" {...props}>
      <path d="M20 3.5 34 8v10.2c0 8.8-5.6 15.4-14 18.3C11.6 33.6 6 27 6 18.2V8l14-4.5Z" stroke="currentColor" strokeWidth="2.4" />
      <path d="M14 23V16M20 27V11M26 21v-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 23h4v3h-4zM18 11h4v16h-4zM24 16h4v7h-4z" fill="currentColor" opacity=".9" />
    </svg>
  );
}

export function AuditPropMark({ className = "h-10 w-10", ...props }: SVGProps<SVGSVGElement>) {
  return <AuditPropLogo className={className} {...props} />;
}
