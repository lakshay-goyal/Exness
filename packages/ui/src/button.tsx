export function Button({ children, className, ...props }: React.ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={`relative rounded-full px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-opacity-80 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
