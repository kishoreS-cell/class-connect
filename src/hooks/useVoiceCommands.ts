import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceCommand {
  phrases: string[];
  action: () => void;
  description: string;
}

interface AICommandResult {
  command: string;
  confidence: number;
  interpreted_as: string;
}

export const useVoiceCommands = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const commandActions = useMemo(() => ({
    navigate_dashboard: {
      action: () => navigateRef.current?.('/dashboard'),
      description: 'Navigate to dashboard',
    },
    navigate_notifications: {
      action: () => navigateRef.current?.('/notifications'),
      description: 'Go to notifications',
    },
    create_class: {
      action: () => navigateRef.current?.('/create-class'),
      description: 'Create a new class',
    },
    join_class: {
      action: () => navigateRef.current?.('/join-class'),
      description: 'Join a class',
    },
    go_home: {
      action: () => navigateRef.current?.('/'),
      description: 'Go to home page',
    },
    sign_out: {
      action: () => {
        toastRef.current?.({ title: 'Voice Command', description: 'Use the sign out button to log out' });
      },
      description: 'Sign out hint',
    },
    help: {
      action: () => {
        toastRef.current?.({
          title: '🎤 Voice Commands',
          description: 'Say: "Dashboard", "Notifications", "Create class", "Join class", "Go home"',
          duration: 5000,
        });
      },
      description: 'Show available commands',
    },
  }), []);

  const processCommandWithAI = useCallback(async (text: string) => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('process-voice-command', {
        body: { transcript: text }
      });

      if (error) {
        console.error('AI processing error:', error);
        throw error;
      }

      const result = data as AICommandResult;
      
      if (result.command && result.command !== 'unknown' && commandActions[result.command as keyof typeof commandActions]) {
        const cmd = commandActions[result.command as keyof typeof commandActions];
        toastRef.current?.({
          title: '🎤 Command Recognized',
          description: `${cmd.description} (understood: "${result.interpreted_as}")`,
        });
        cmd.action();
      } else {
        toastRef.current?.({
          title: 'Command not recognized',
          description: `"${text}" - Try saying "help" for available commands`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error processing command:', error);
      // Fallback to local processing
      processCommandLocally(text);
    } finally {
      setIsProcessing(false);
    }
  }, [commandActions]);

  const processCommandLocally = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    
    const localCommands = [
      { keywords: ['dashboard', 'go to dashboard', 'open dashboard'], command: 'navigate_dashboard' },
      { keywords: ['notifications', 'go to notifications', 'open notifications', 'check notifications'], command: 'navigate_notifications' },
      { keywords: ['create class', 'new class', 'add class'], command: 'create_class' },
      { keywords: ['join class', 'enter class'], command: 'join_class' },
      { keywords: ['go home', 'home', 'main page'], command: 'go_home' },
      { keywords: ['sign out', 'logout', 'log out'], command: 'sign_out' },
      { keywords: ['help', 'commands', 'what can'], command: 'help' },
    ];

    for (const cmd of localCommands) {
      for (const keyword of cmd.keywords) {
        if (lowerText.includes(keyword)) {
          const action = commandActions[cmd.command as keyof typeof commandActions];
          if (action) {
            toastRef.current?.({
              title: '🎤 Command Recognized',
              description: action.description,
            });
            action.action();
            return;
          }
        }
      }
    }

    toastRef.current?.({
      title: 'Command not recognized',
      description: `"${text}" - Say "help" for available commands`,
      variant: 'destructive',
    });
  }, [commandActions]);

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
          // Use AI to process the command
          processCommandWithAI(text);
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
  }, [processCommandWithAI]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isProcessing) {
      try {
        setTranscript('');
        recognitionRef.current.start();
        setIsListening(true);
        toastRef.current?.({
          title: '🎤 Listening...',
          description: 'Speak naturally - AI will understand you',
        });
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  }, [isListening, isProcessing]);

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

  const commands: VoiceCommand[] = useMemo(() => [
    { phrases: ['dashboard'], action: () => navigateRef.current?.('/dashboard'), description: 'Navigate to dashboard' },
    { phrases: ['create class'], action: () => navigateRef.current?.('/create-class'), description: 'Create a new class' },
    { phrases: ['join class'], action: () => navigateRef.current?.('/join-class'), description: 'Join a class' },
    { phrases: ['go home'], action: () => navigateRef.current?.('/'), description: 'Go to home page' },
  ], []);

  return {
    isListening,
    isSupported,
    isProcessing,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    commands,
  };
};
