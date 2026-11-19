import type { InputHTMLAttributes, ReactNode } from "react";

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ id, label, hint, error, required = false, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`tk-field ${error ? "tk-field--error" : ""}`.trim()}>
      <label className="tk-field__label" htmlFor={id}>
        <span>{label}</span>
        {required && (
          <span className="tk-field__required" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {hint && (
        <p id={hintId} className="tk-field__hint">
          {hint}
        </p>
      )}

      {children}

      {error && (
        <p id={errorId} className="tk-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function TextInput({ hasError = false, className = "", ...props }: TextInputProps) {
  return (
    <input
      className={`tk-input ${hasError ? "tk-input--error" : ""} ${className}`.trim()}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}

export interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "inputMode"
> {
  unit: string;
  hasError?: boolean;
}

export function NumberInput({
  unit,
  hasError = false,
  className = "",
  ...props
}: NumberInputProps) {
  return (
    <div className={`tk-number-input ${hasError ? "tk-number-input--error" : ""}`.trim()}>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={`tk-input tk-tabular tk-number-input__control ${className}`.trim()}
        aria-invalid={hasError || undefined}
        {...props}
      />
      <span className="tk-number-input__unit">{unit}</span>
    </div>
  );
}
