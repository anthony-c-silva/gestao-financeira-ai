import React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDeleting?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting,
}: Props) {
  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={() => onClose()}
      title={title}
      description={message}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 mb-8 text-sm">{message}</p>
      </div>

      <div className="flex sm:flex-row flex-col-reverse gap-3">
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="w-full px-5 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="w-full px-5 py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
        >
          {isDeleting ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            "Confirmar Exclusão"
          )}
        </button>
      </div>
    </ResponsiveModal>
  );
}
