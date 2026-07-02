import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const ESTILO_BASE =
  "w-full min-h-[44px] rounded-[var(--radio-sm)] border border-borde bg-superficie px-3.5 py-2 text-base text-texto placeholder:text-texto-tenue transition-colors focus:border-marca disabled:opacity-50 disabled:cursor-not-allowed";

type PropsInput = React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean };

export const Input = forwardRef<HTMLInputElement, PropsInput>(function Input(
  { className, error, ...resto },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(ESTILO_BASE, error && "border-peligro", className)}
      {...resto}
    />
  );
});

type PropsTextarea = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean };

export const Textarea = forwardRef<HTMLTextAreaElement, PropsTextarea>(function Textarea(
  { className, error, ...resto },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(ESTILO_BASE, "min-h-[96px] resize-y", error && "border-peligro", className)}
      {...resto}
    />
  );
});

type PropsSelect = React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean };

export const Select = forwardRef<HTMLSelectElement, PropsSelect>(function Select(
  { className, error, children, ...resto },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(ESTILO_BASE, "cursor-pointer", error && "border-peligro", className)}
      {...resto}
    >
      {children}
    </select>
  );
});
