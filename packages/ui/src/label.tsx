import type { LabelHTMLAttributes } from "react";
import { cx } from "./cx.ts";

type Props = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: Props) {
  return <label className={cx("field-label", className)} {...props} />;
}
