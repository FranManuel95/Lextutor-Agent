"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Minimal checkbox (no Radix dep) — mirrors the API of the Radix checkbox
// so existing `checked` / `onCheckedChange` call sites work.
export interface CheckboxProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "type"
> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={!!checked}
        data-state={checked ? "checked" : "unchecked"}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          if (!disabled) onCheckedChange?.(!checked);
        }}
        className={cn(
          "peer flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-gem-offwhite/40 bg-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-law-gold/40 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-law-gold data-[state=checked]:bg-law-gold data-[state=checked]:text-gem-onyx",
          className
        )}
        {...props}
      >
        {checked && <Check className="h-3 w-3" />}
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";
