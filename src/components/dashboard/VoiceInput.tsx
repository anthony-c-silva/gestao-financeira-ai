"use client";

import React, { useState, useEffect } from "react";
import { Mic, Loader2, StopCircle, Keyboard, Send, X } from "lucide-react";
// Importamos o novo modal
import { FeedbackModal, FeedbackType } from "@/components/ui/FeedbackModal";

export interface AiTransactionData {
  amount?: number;
  description?: string;
  category?: string;
  type?: "INCOME" | "EXPENSE";
  paymentMethod?: string;
  date?: string;
}

interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
  error: string;
}

interface ISpeechRecognition {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
}

interface IWindow extends Window {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}

interface VoiceInputProps {
  onSuccess: (data: AiTransactionData) => void;
}

export function VoiceInput({ onSuccess }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [recognition, setRecognition] = useState<ISpeechRecognition | null>(
    null
  );

  // Estado para controlar o Modal de Feedback
  const [feedback, setFeedback] = useState<{
    isOpen: boolean;
    type: FeedbackType;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  // Função auxiliar para abrir o modal
  const showFeedback = (type: FeedbackType, title: string, message: string) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const closeFeedback = () => {
    setFeedback((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as unknown as IWindow;
      const SpeechRecognition =
        win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.lang = "pt-BR";
        recognitionInstance.interimResults = false;

        recognitionInstance.onresult = async (
          event: SpeechRecognitionEvent
        ) => {
          const transcript = event.results[0][0].transcript;
          setIsRecording(false);
          await processTextWithAI(transcript);
        };

        // --- TRATAMENTO DE ERROS COM MODAL BONITO ---
        recognitionInstance.onerror = (event: SpeechRecognitionEvent) => {
          console.error("Erro voz:", event.error);
          setIsRecording(false);

          if (event.error === "not-allowed") {
            showFeedback(
              "warning",
              "Permissão Negada",
              "O navegador bloqueou o microfone.\n\nClique no cadeado 🔒 ao lado do endereço do site (lá em cima) e ative a opção 'Microfone'."
            );
          } else if (event.error === "no-speech") {
            showFeedback(
              "info",
              "Não ouvi nada",
              "Parece que você não falou nada ou o microfone está mudo.\n\nTente falar mais perto ou use o botão de teclado ao lado para digitar."
            );
          } else if (event.error === "audio-capture") {
            showFeedback(
              "error",
              "Microfone Desconectado",
              "Não encontrei nenhum microfone.\nVerifique se ele está conectado ou use o modo teclado."
            );
          } else {
            showFeedback(
              "error",
              "Erro Desconhecido",
              `Ocorreu um erro técnico: ${event.error}\nTente digitar o comando.`
            );
          }
        };

        recognitionInstance.onend = () => {
          setIsRecording(false);
        };

        setRecognition(recognitionInstance);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processTextWithAI = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    setShowTextInput(false);

    try {
      const response = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("Erro na IA");

      const data: AiTransactionData = await response.json();
      onSuccess(data);
      setTextInput("");
    } catch (error) {
      console.error(error);
      showFeedback(
        "error",
        "Falha na Inteligência",
        "Não consegui processar seu comando no momento.\nVerifique sua conexão e tente novamente."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMicClick = () => {
    if (!recognition) {
      showFeedback(
        "warning",
        "Navegador Incompatível",
        "Este navegador não suporta comandos de voz.\nPor favor, use o Google Chrome ou digite o comando no botão de teclado."
      );
      return;
    }

    if (isRecording) {
      recognition.stop();
    } else {
      try {
        recognition.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Erro ao iniciar:", error);
        setIsRecording(false);
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processTextWithAI(textInput);
  };

  return (
    <>
      {/* Renderiza o Modal de Feedback no topo da hierarquia */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={closeFeedback}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />

      {isProcessing ? (
        <div className="bg-indigo-600 text-white p-4 rounded-full shadow-xl animate-pulse">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : showTextInput ? (
        <form
          onSubmit={handleTextSubmit}
          className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-xl border border-indigo-100 animate-in slide-in-from-bottom-2"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Ex: Gastei 50 no mercado..."
            className="pl-3 py-2 outline-none text-slate-700 text-sm w-48 sm:w-64"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowTextInput(false)}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            {/* ÍCONE ALTERADO AQUI: De StopCircle para X */}
            <X size={20} />
          </button>
          <button
            type="submit"
            disabled={!textInput}
            className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTextInput(true)}
            className="p-4 bg-white text-indigo-600 rounded-full shadow-lg border border-indigo-50 hover:bg-indigo-50 transition-all active:scale-95"
            title="Digitar comando"
          >
            <Keyboard size={24} />
          </button>

          <button
            onClick={handleMicClick}
            className={`p-4 rounded-full shadow-xl transition-all transform active:scale-95 flex items-center justify-center ${
              isRecording
                ? "bg-red-500 text-white animate-pulse shadow-red-300 ring-4 ring-red-100"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-300"
            }`}
            title="Comando de Voz"
          >
            {isRecording ? <StopCircle size={24} /> : <Mic size={24} />}
          </button>
        </div>
      )}
    </>
  );
}
