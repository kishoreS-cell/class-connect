import { useState, useEffect, useCallback, useRef } from 'react';
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
  const navigate = useNavigate();
  const { toast } = useToast();

  const commands: VoiceCommand[] = [
    {
      phrases: ['go to dashboard', 'open dashboard', 'dashboard', 'show dashboard'],
      action: () => navigate('/dashboard'),
      description: 'Navigate to dashboard',
    },
    {
      phrases: ['create class', 'new class', 'add class', 'create new class'],
      action: () => navigate('/create-class'),
      description: 'Create a new class',
    },
    {
      phrases: ['join class', 'join a class', 'enter class'],
      action: () => navigate('/join-class'),
      description: 'Join a class',
    },
    {
      phrases: ['go home', 'home', 'go to home', 'main page'],
      action: () => navigate('/'),
      description: 'Go to home page',
    },
    {
      phrases: ['sign out', 'logout', 'log out', 'sign me out'],
      action: () => {
        toast({ title: 'Voice Command', description: 'Use the sign out button to log out' });
      },
      description: 'Sign out hint',
    },
    {
      phrases: ['help', 'show commands', 'what can you do', 'voice commands'],
      action: () => {
        toast({
          title: 'Voice Commands',
          description: 'Say: "Dashboard", "Create class", "Join class", "Go home"',
          duration: 5000,
        });
      },
      description: 'Show available commands',
    },
  ];

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const text = result[0].transcript.toLowerCase().trim();
        setTranscript(text);

        if (result.isFinal) {
          processCommand(text);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          toast({
            title: 'Voice Error',
            description: 'Could not recognize speech. Please try again.',
            variant: 'destructive',
          });
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const processCommand = useCallback((text: string) => {
    for (const command of commands) {
      for (const phrase of command.phrases) {
        if (text.includes(phrase)) {
          toast({
            title: '🎤 Command Recognized',
            description: command.description,
          });
          command.action();
          return;
        }
      }
    }
    
    toast({
      title: 'Command not recognized',
      description: `"${text}" - Say "help" for available commands`,
      variant: 'destructive',
    });
  }, [commands, toast]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
      toast({
        title: '🎤 Listening...',
        description: 'Speak a command',
      });
    }
  }, [isListening, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
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
