import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({
  className = "",
  variant = "primary",
  ...props
}: Props) {
  return (
    <button
      className={`ss-button ss-button-${variant} ${className}`.trim()}
      {...props}
    />
  );
}
