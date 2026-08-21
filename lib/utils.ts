import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function wait(ms = 420) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
