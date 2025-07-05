import type { SVGProps } from "react";

export function FieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="12" x="3" y="6" rx="2" ry="2" />
      <line x1="12" x2="12" y1="6" y2="18" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
