"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";

// --- TIPAGEM MANUAL (Para evitar erros de TS) ---
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

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
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

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
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  
  // Ref para manter a função atualizada sem recriar o useEffect
  const onModeChangeRef = useRef(onModeChange);

  useEffect(() => {
    onModeChangeRef.current = onModeChange;
  }, [onModeChange]);

  useEffect(() => {
    let recognitionInstance: SpeechRecognition | null = null;

    if (typeof window !== "undefined") {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognitionConstructor) {
        recognitionInstance = new SpeechRecognitionConstructor();
        recognitionInstance.continuous = false; // Importante para parar ao terminar de falar
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = "pt-BR";

        recognitionInstance.onstart = () => {
          setIsListening(true);
          onModeChangeRef.current(true);
        };

        recognitionInstance.onend = () => {
          // Só atualizamos se não estivermos processando (para evitar piscar)
          setIsListening(false);
        };

        recognitionInstance.onresult = async (event: SpeechRecognitionEvent) => {
          // Força parada imediata ao receber resultado
          recognitionInstance?.stop(); 
          
          const transcript = event.results[0][0].transcript;
          if (transcript.trim()) {
            await processVoiceCommand(transcript);
          }
        };

        // --- TRATAMENTO DE ERROS MELHORADO ---
        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          // Ignora erros de "abortado" (clique manual) ou "sem fala" (silêncio)
          if (event.error === 'aborted' || event.error === 'no-speech') {
            setIsListening(false);
            onModeChangeRef.current(false);
            return;
          }

          console.error("Erro no reconhecimento de voz:", event.error);
          
          if (event.error === 'not-allowed') {
            alert("Permissão de microfone negada.");
          }
          
          setIsListening(false);
          onModeChangeRef.current(false);
        };

        setRecognition(recognitionInstance);
      }
    }

    return () => {
      if (recognitionInstance) {
        recognitionInstance.abort();
      }
    };
  }, []);

  const processVoiceCommand = async (text: string) => {
    setIsProcessing(true);
    // Garante que o modo de escuta visual encerre
    onModeChangeRef.current(false);

    try {
      const res = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, userId }),
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data);
      } else {
        alert("Não entendi. Tente falar novamente.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao processar áudio.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      alert("Seu navegador não suporta voz.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false); // Feedback visual imediato
    } else {
      try {
        recognition.start();
      } catch (error) {
        // Se der erro dizendo que "já começou", apenas atualizamos o estado
        console.warn("Recuperando sessão de voz ativa...");
        setIsListening(true);
        onModeChangeRef.current(true);
      }
    }
  };

  return (
    <button
      onClick={toggleListening}
      disabled={isProcessing}
      className={`relative h-12 px-4 sm:h-[56px] sm:px-6 rounded-full flex items-center justify-center gap-2 font-bold shadow-lg transition-all duration-300 ${
        isListening
          ? "bg-rose-500 text-white animate-pulse scale-105 shadow-rose-300"
          : isProcessing
          ? "bg-brand-400 text-white cursor-wait"
          : "bg-white text-brand-900 hover:bg-brand-50 border border-brand-100 shadow-sm"
      }`}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="hidden sm:inline">Pensando...</span>
        </>
      ) : isListening ? (
        <>
          <Square className="w-5 h-5" fill="currentColor" />
          <span className="hidden sm:inline">Ouvindo...</span>
        </>
      ) : (
        <>
          <Mic className="w-5 h-5" />
          <span className="text-sm sm:text-base">IA</span>
        </>
      )}
    </button>
  );
}