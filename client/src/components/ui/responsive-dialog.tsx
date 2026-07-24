"use client";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onClose?: () => void;
  closeDisabled?: boolean;
  desktopWidthClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

// Sheet on mobile, centered Dialog on desktop
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  onClose,
  closeDisabled,
  desktopWidthClassName = "w-[448px]",
  contentClassName,
  children,
}: ResponsiveDialogProps) {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const Root = isMobile ? Sheet : Dialog;
  const Content = isMobile ? SheetContent : DialogContent;
  const Header = isMobile ? SheetHeader : DialogHeader;
  const Title = isMobile ? SheetTitle : DialogTitle;

  return (
    <Root open={open} onOpenChange={onOpenChange}>
      <Content
        side={isMobile ? "bottom" : undefined}
        className={cn(
          "p-0",
          isMobile ? "w-full rounded-t-2xl" : desktopWidthClassName,
          contentClassName
        )}
      >
        <Header className="flex flex-row items-center justify-between px-8 py-6 pb-2">
          <Title className="text-xl font-semibold">{title}</Title>
          <Button
            variant="ghost"
            className="h-8 w-8 rounded-xl p-0"
            disabled={closeDisabled}
            onClick={() => (onClose ? onClose() : onOpenChange(false))}
          >
            <X className="h-4 w-4" />
          </Button>
        </Header>
        {children}
      </Content>
    </Root>
  );
}
