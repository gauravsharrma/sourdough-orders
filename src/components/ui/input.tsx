import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, error, className = "", ...props }, ref) => {
    return (
      <div>
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-300"
              : "border-gray-300 focus:border-amber-500 focus:ring-amber-300"
          } disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
