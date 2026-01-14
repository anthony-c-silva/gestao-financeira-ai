"use client";

import React, { useState, useEffect } from "react";
import { Mic, Loader2, StopCircle, Keyboard, Send, X } from "lucide-react";
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
  // NOVO: Função para avisar o Dashboard para esconder o botão Registrar
  onModeChange?: (isInputMode: boolean) => void;
}

export function VoiceInput({ onSuccess, onModeChange }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [recognition, setRecognition] = useState<ISpeechRecognition | null>(null);

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

  const showFeedback = (type: FeedbackType, title: string, message: string) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const closeFeedback = () => {
    setFeedback((prev) => ({ ...prev, isOpen: false }));
  };

  // Função para controlar a abertura/fechamento do input e avisar o pai
  const toggleInputMode = (active: boolean) => {
    setShowTextInput(active);
    if (onModeChange) {
      onModeChange(active);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as unknown as IWindow;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.lang = "pt-BR";
        recognitionInstance.interimResults = false;

        recognitionInstance.onresult = async (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setIsRecording(false);
          await processTextWithAI(transcript);
        };

        recognitionInstance.onerror = (event: SpeechRecognitionEvent) => {
          console.error("Erro voz:", event.error);
          setIsRecording(false);

          if (event.error === "not-allowed") {
            showFeedback(
              "warning",
              "Permissão Negada",
              "O navegador bloqueou o microfone.\n\nClique no cadeado 🔒 ao lado do endereço do site e ative a opção 'Microfone'."
            );
          } else if (event.error === "no-speech") {
            showFeedback(
              "info",
              "Não ouvi nada",
              "O microfone está mudo ou você não falou.\n\nTente falar mais perto ou use o botão de teclado para digitar."
            );
          } else {
            showFeedback(
              "error",
              "Erro Técnico",
              `Ocorreu um erro: ${event.error}\nPor favor, use a digitação.`
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
    toggleInputMode(false); // Fecha o input ao enviar

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
        "Não consegui processar seu comando.\nVerifique sua conexão e tente novamente."
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
        "Este navegador não suporta voz.\nPor favor, use o botão de teclado para digitar."
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
        /* MUDANÇA AQUI: Layout Fixo e Responsivo para o Campo de Texto */
        <form
          onSubmit={handleTextSubmit}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-white p-3 rounded-2xl shadow-2xl border border-indigo-100 flex items-center gap-2 z-50 animate-in slide-in-from-bottom-4 zoom-in-95"
        >
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Ex: Gastei 50 no mercado..."
            className="flex-1 pl-3 py-3 outline-none text-slate-700 text-base font-medium placeholder:text-slate-400"
            autoFocus
          />
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toggleInputMode(false)} // Fecha e avisa o pai para mostrar botões
              className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
            <button
              type="submit"
              disabled={!textInput}
              className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      ) : (
        /* BOTÕES NORMAIS (Só aparecem se não estiver digitando) */
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleInputMode(true)} // Abre e avisa o pai para esconder outros botões
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