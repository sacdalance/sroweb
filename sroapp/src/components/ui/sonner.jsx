import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          success: "!bg-sro-secondary-50 !text-sro-secondary-700 !border-sro-secondary-200",
          error: "!bg-sro-primary-50 !text-sro-primary-700 !border-sro-primary-200",
          warning: "!bg-sro-accent-50 !text-sro-accent-700 !border-sro-accent-200",
        },
      }}
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
      }}
      {...props}
    />
  );
};

export { Toaster };
