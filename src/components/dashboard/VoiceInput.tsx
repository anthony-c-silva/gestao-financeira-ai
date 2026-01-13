"use client";

import React, { useState, useEffect } from "react";
import { Mic, Loader2, StopCircle } from "lucide-react";

// 1. Definir o tipo de dados que a IA devolve
export interface AiTransactionData {
  amount?: number;
  description?: string;
  category?: string;
  type?: "INCOME" | "EXPENSE";
  paymentMethod?: string;
  date?: string;
}

interface VoiceInputProps {
  onSuccess: (data: AiTransactionData) => void;
}

// 2. Definir tipos manuais para a API de Voz (que não tem tipagem oficial completa)
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

export function VoiceInput({ onSuccess }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState<ISpeechRecognition | null>(
    null
  );

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
          console.log("Texto ouvido:", transcript);
          setIsRecording(false);
          await processTextWithAI(transcript);
        };

        recognitionInstance.onerror = (event: SpeechRecognitionEvent) => {
          console.error("Erro no reconhecimento de voz:", event.error);
          setIsRecording(false);
          alert("Não entendi. Tente falar mais perto do microfone.");
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
    setIsProcessing(true);
    try {
      const response = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("Erro na IA");

      const data: AiTransactionData = await response.json();
      onSuccess(data);
    } catch (error) {
      console.error(error);
      alert("Erro ao processar com Inteligência Artificial.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    if (!recognition) {
      alert(
        "Seu navegador não suporta comando de voz. Tente usar o Google Chrome."
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
        console.error("Erro ao iniciar gravação:", error);
        setIsRecording(false);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className={`p-4 rounded-full shadow-xl transition-all transform active:scale-95 flex items-center justify-center ${
        isRecording
          ? "bg-red-500 text-white animate-pulse shadow-red-300"
          : isProcessing
          ? "bg-indigo-400 text-white cursor-wait"
          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-300"
      }`}
      title="Comando de Voz com IA"
    >
      {isProcessing ? (
        <Loader2 size={24} className="animate-spin" />
      ) : isRecording ? (
        <StopCircle size={24} />
      ) : (
        <Mic size={24} />
      )}
    </button>
  );
}
