import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface VoiceCommand {
  phrases: string[];
  action: () => void;
  description: string;
}

export const useVoiceCommands = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const navigateRef = useRef<ReturnType<typeof useNavigate>>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const toastRef = useRef(toast);

  // Keep refs updated
  useEffect(() => {
    navigateRef.current = navigate;
    toastRef.current = toast;
  }, [navigate, toast]);

  const commands: VoiceCommand[] = useMemo(() => [
    {
      phrases: ['go to dashboard', 'open dashboard', 'dashboard', 'show dashboard'],
      action: () => navigateRef.current?.('/dashboard'),
      description: 'Navigate to dashboard',
    },
    {
      phrases: ['create class', 'new class', 'add class', 'create new class'],
      action: () => navigateRef.current?.('/create-class'),
      description: 'Create a new class',
    },
    {
      phrases: ['join class', 'join a class', 'enter class'],
      action: () => navigateRef.current?.('/join-class'),
      description: 'Join a class',
    },
    {
      phrases: ['go home', 'home', 'go to home', 'main page'],
      action: () => navigateRef.current?.('/'),
      description: 'Go to home page',
    },
    {
      phrases: ['sign out', 'logout', 'log out', 'sign me out'],
      action: () => {
        toastRef.current?.({ title: 'Voice Command', description: 'Use the sign out button to log out' });
      },
      description: 'Sign out hint',
    },
    {
      phrases: ['help', 'show commands', 'what can you do', 'voice commands'],
      action: () => {
        toastRef.current?.({
          title: 'Voice Commands',
          description: 'Say: "Dashboard", "Create class", "Join class", "Go home"',
          duration: 5000,
        });
      },
      description: 'Show available commands',
    },
  ], []);

  const processCommand = useCallback((text: string) => {
    for (const command of commands) {
      for (const phrase of command.phrases) {
        if (text.includes(phrase)) {
          toastRef.current?.({
            title: '🎤 Command Recognized',
            description: command.description,
          });
          command.action();
          return;
        }
      }
    }
    
    toastRef.current?.({
      title: 'Command not recognized',
      description: `"${text}" - Say "help" for available commands`,
      variant: 'destructive',
    });
  }, [commands]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const text = result[0].transcript.toLowerCase().trim();
        setTranscript(text);

        if (result.isFinal) {
          processCommand(text);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          toastRef.current?.({
            title: 'Voice Error',
            description: 'Could not recognize speech. Please try again.',
            variant: 'destructive',
          });
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore abort errors
        }
      }
    };
  }, [processCommand]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        recognitionRef.current.start();
        setIsListening(true);
        toastRef.current?.({
          title: '🎤 Listening...',
          description: 'Speak a command',
        });
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
      setIsListening(false);
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    commands,
  };
};
