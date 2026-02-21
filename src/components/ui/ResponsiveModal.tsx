"use client";

import * as React from "react";
import { Drawer } from "vaul";
import * as Dialog from "@radix-ui/react-dialog";

// Hook interno para detetar se é Desktop ou Mobile
function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(false);

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }
    const result = window.matchMedia(query);
    result.addEventListener("change", onChange);
    setValue(result.matches);
    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function ResponsiveModal({
  isOpen,
  onClose,
  title = "Modal",
  description = "Janela de diálogo",
  children,
}: ResponsiveModalProps) {
  // A partir de 768px (Tablet/Desktop) considera-se grande
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            <Dialog.Description className="sr-only">
              {description}
            </Dialog.Description>
            {children}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  // Mobile: Gaveta arrastável nativa
  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex max-h-[96vh] flex-col rounded-t-[32px] bg-white focus:outline-none">
          <div className="flex-1 overflow-y-auto rounded-t-[32px] bg-white p-6 pb-safe">
            <div className="mx-auto mb-6 h-1.5 w-12 shrink-0 rounded-full bg-slate-200" />
            <Drawer.Title className="sr-only">{title}</Drawer.Title>
            <Drawer.Description className="sr-only">
              {description}
            </Drawer.Description>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
