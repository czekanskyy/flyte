import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx.ts";

type Variant = "primary" | "ghost";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ className, variant = "primary", type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      className={cx("btn", variant === "ghost" ? "btn-ghost" : undefined, className)}
      {...props}
    />
  );
}
