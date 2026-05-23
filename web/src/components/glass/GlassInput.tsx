import { type InputHTMLAttributes } from "react";

export function GlassInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`glass-input w-full rounded-xl px-4 py-3 text-sm ${className}`}
      {...props}
    />
  );
}

export function GlassTextarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`glass-input w-full resize-none rounded-xl px-4 py-3 text-sm ${className}`}
      {...props}
    />
  );
}
