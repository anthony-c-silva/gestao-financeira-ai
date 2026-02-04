"use client";

import React, { useState, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

// --- CORREÇÃO DE TIPAGEM TYPESCRIPT ---
// Declaramos os tipos globais que o navegador possui mas o TS desconhece por padrão
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

// Estendemos a interface Window para incluir as propriedades de voz
declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}
// --------------------------------------

export interface AiTransactionData {
  amount: number;
  description: string;
  category: string;
  type: "INCOME" | "EXPENSE";
  paymentMethod: string;
  date: string;
}

interface VoiceInputProps {
  onSuccess: (data: AiTransactionData) => void;
  onModeChange: (isListening: boolean) => void;
  userId: string;
}

export function VoiceInput({ onSuccess, onModeChange, userId }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // Usamos 'any' aqui para evitar conflitos de tipo complexos, já que definimos acima
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Verifica se existe a API padrão ou a versão Webkit (Chrome)
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognitionConstructor) {
        const recognitionInstance = new SpeechRecognitionConstructor();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = "pt-BR";

        recognitionInstance.onstart = () => {
          setIsListening(true);
          onModeChange(true);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
          // Não chamamos onModeChange(false) aqui pois entraremos em "processing"
        };

        recognitionInstance.onresult = async (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          await processVoiceCommand(transcript);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, [onModeChange]); // Adicionado onModeChange nas dependências

  const processVoiceCommand = async (text: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text,
          userId // Envia o ID para buscar categorias personalizadas
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data);
      } else {
        alert("Não entendi o comando. Tente novamente.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão com a IA.");
    } finally {
      setIsProcessing(false);
      onModeChange(false);
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      alert("Seu navegador não suporta comando de voz.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  return (
    <button
      onClick={toggleListening}
      disabled={isProcessing}
      className={`relative h-[56px] px-6 rounded-full flex items-center justify-center gap-2 font-bold shadow-lg transition-all duration-300 ${
        isListening
          ? "bg-rose-500 text-white animate-pulse scale-105 shadow-rose-300"
          : isProcessing
          ? "bg-brand-400 text-white cursor-wait"
          : "bg-white text-brand-900 hover:bg-brand-50 border border-brand-100 shadow-sm"
      }`}
    >
      {isProcessing ? (
        <>
          <Loader2 size={20} className="animate-spin" />
          <span>Pensando...</span>
        </>
      ) : isListening ? (
        <>
          <Square size={20} fill="currentColor" />
          <span>Ouvindo...</span>
        </>
      ) : (
        <>
          <Mic size={20} />
          <span>IA</span>
        </>
      )}
    </button>
  );
}