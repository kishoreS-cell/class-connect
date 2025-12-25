import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { cn } from '@/lib/utils';

export const VoiceCommandButton: React.FC = () => {
  const { isListening, isSupported, isProcessing, transcript, toggleListening } = useVoiceCommands();

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        onClick={toggleListening}
        variant="outline"
        size="icon"
        disabled={isProcessing}
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          isListening && 'bg-primary text-primary-foreground border-primary animate-pulse',
          isProcessing && 'bg-secondary'
        )}
        aria-label={isListening ? 'Stop listening' : 'Start voice command'}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isListening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        
        {isListening && !isProcessing && (
          <>
            <span className="absolute inset-0 rounded-md animate-ping bg-primary/30" />
            <span className="absolute -inset-1 rounded-full animate-pulse bg-primary/20" />
          </>
        )}
      </Button>
      
      {(isListening || isProcessing) && transcript && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm shadow-lg border animate-fade-in z-50">
          {isProcessing ? '🤖 Processing...' : `"${transcript}"`}
        </div>
      )}
    </div>
  );
};
