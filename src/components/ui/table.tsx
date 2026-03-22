import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";

export function Table({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={`bg-gray-50 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`divide-y divide-gray-200 bg-white ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`transition-colors hover:bg-gray-50 ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({
  className = "",
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className = "",
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`whitespace-nowrap px-4 py-3 text-sm text-gray-700 ${className}`} {...props}>
      {children}
    </td>
  );
}
