"use client";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";
import { Check } from "lucide-react";

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme}
      position="top-center"
      className="toaster group"
      icons={{
        success: <Check className="w-5 h-5 text-green-600" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group toast group-[.toaster]:bg-[#DAFFD4] group-[.toaster]:text-[#1DA606] group-[.toaster]:text-foreground group-[.toaster]:font-semibold group-[.toaster]:border-border group-[.toaster]:shadow-lg rounded-full",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
