import { ButtonHTMLAttributes, ReactNode } from "react";

const className =
  "bg-blue-600 text-white uppercase rounded p-2 my-2 mx-1 disabled:bg-blue-300";

export const Button = ({
  children,
  type = "button",
  ...props
}: { children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} type={type} className={className}>
    {children}
  </button>
);

export default Button;
