import type { InputHTMLAttributes } from "react";
import { cx } from "./cx.ts";

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return <input className={cx("field", className)} {...props} />;
}
