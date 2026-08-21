import { cloneElement, isValidElement } from "react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BaseProps = {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: false;
  };

type ButtonAsChild = Omit<BaseProps, "children"> & {
  asChild: true;
  children: ReactElement<{ className?: string }>;
};

export function Button(props: ButtonAsButton | ButtonAsChild) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    asChild,
    ...rest
  } = props;

  const classes = cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-card font-black transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55",
    variant === "primary" && "bg-ink text-white shadow-soft hover:-translate-y-0.5 hover:shadow-lift",
    variant === "secondary" &&
      "border border-ink/12 bg-white text-ink shadow-sm hover:-translate-y-0.5 hover:bg-cloud",
    variant === "quiet" && "bg-transparent text-ink hover:bg-cloud",
    variant === "danger" && "bg-coral text-white shadow-soft hover:bg-coral/90",
    size === "sm" && "px-3 py-2 text-xs",
    size === "md" && "px-4 py-3 text-sm",
    size === "lg" && "px-5 py-4 text-base",
    size === "icon" && "size-11 p-0",
    className
  );

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      className: cn(classes, children.props.className)
    });
  }

  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
