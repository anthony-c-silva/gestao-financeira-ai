import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error";
  title: string;
  message: string;
}

export function FeedbackModal({
  isOpen,
  onClose,
  type,
  title,
  message,
}: Props) {
  const isSuccess = type === "success";

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={() => onClose()}
      title={title}
      description={message}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isSuccess
              ? "bg-emerald-100 text-emerald-600"
              : "bg-rose-100 text-rose-600"
          }`}
        >
          {isSuccess ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 mb-8 text-sm">{message}</p>

        <button
          onClick={onClose}
          className={`w-full px-5 py-3 rounded-xl font-bold text-white transition-colors ${
            isSuccess
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-rose-600 hover:bg-rose-700"
          }`}
        >
          Entendi
        </button>
      </div>
    </ResponsiveModal>
  );
}
