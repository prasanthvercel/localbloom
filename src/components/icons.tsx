import type { SVGProps } from "react";

export const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    <path d="M12 2a10 10 0 0 0-7.07 2.93c.52.52.98 1.07 1.42 1.66A6 6 0 0 1 12 6v1M12 22a10 10 0 0 0 7.07-2.93c-.52-.52-.98-1.07-1.42-1.66A6 6 0 0 1 12 18v-1" />
  </svg>
);
