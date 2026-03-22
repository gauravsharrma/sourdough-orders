import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  options: SelectOption[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, id, options, error, className = "", ...props }, ref) => {
    return (
      <div>
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
        <select
          ref={ref}
          id={id}
          className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-300"
              : "border-gray-300 focus:border-amber-500 focus:ring-amber-300"
          } disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
