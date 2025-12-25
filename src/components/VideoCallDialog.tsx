import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  callType: 'audio' | 'video';
  isIncoming?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}

export function VideoCallDialog({
  open,
  onOpenChange,
  recipientName,
  callType,
  isIncoming = false,
  onAccept,
  onDecline,
}: VideoCallDialogProps) {
  const { toast } = useToast();
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      setCallStatus('ringing');
      setCallDuration(0);
      return;
    }

    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video',
          audio: true,
        });
        streamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Simulate connection after 2 seconds
        if (!isIncoming) {
          setTimeout(() => {
            setCallStatus('connected');
            toast({
              title: 'Connected',
              description: `Call with ${recipientName} started`,
            });
          }, 2000);
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast({
          title: 'Error',
          description: 'Could not access camera/microphone',
          variant: 'destructive',
        });
        onOpenChange(false);
      }
    };

    if (!isIncoming || callStatus === 'connected') {
      startLocalStream();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [open, callType, isIncoming, callStatus]);

  useEffect(() => {
    if (callStatus !== 'connected') return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setCallStatus('ended');
    onOpenChange(false);
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleAccept = () => {
    setCallStatus('connected');
    onAccept?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-gray-900">
        <div className="relative h-[500px] flex flex-col">
          {/* Remote video (placeholder for now) */}
          <div className="flex-1 bg-gray-800 flex items-center justify-center">
            {callStatus === 'ringing' ? (
              <div className="text-center text-white">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <span className="text-4xl font-bold text-primary">
                    {recipientName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-xl font-medium mb-2">{recipientName}</p>
                <p className="text-gray-400">
                  {isIncoming ? 'Incoming call...' : 'Calling...'}
                </p>
              </div>
            ) : (
              <div className="text-center text-white">
                <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl font-bold text-primary">
                    {recipientName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="text-xl font-medium">{recipientName}</p>
                <p className="text-gray-400 mt-2">{formatDuration(callDuration)}</p>
              </div>
            )}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover hidden"
            />
          </div>

          {/* Local video preview */}
          {callType === 'video' && !isVideoOff && (
            <div className="absolute bottom-24 right-4 w-32 h-24 bg-gray-700 rounded-lg overflow-hidden shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Call controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            {isIncoming && callStatus === 'ringing' ? (
              <div className="flex justify-center gap-8">
                <Button
                  variant="destructive"
                  size="lg"
                  className="rounded-full h-14 w-14"
                  onClick={() => {
                    onDecline?.();
                    onOpenChange(false);
                  }}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                <Button
                  variant="default"
                  size="lg"
                  className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600"
                  onClick={handleAccept}
                >
                  <Phone className="h-6 w-6" />
                </Button>
              </div>
            ) : (
              <div className="flex justify-center gap-4">
                <Button
                  variant={isMuted ? 'destructive' : 'secondary'}
                  size="lg"
                  className="rounded-full h-12 w-12"
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                
                {callType === 'video' && (
                  <Button
                    variant={isVideoOff ? 'destructive' : 'secondary'}
                    size="lg"
                    className="rounded-full h-12 w-12"
                    onClick={toggleVideo}
                  >
                    {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  size="lg"
                  className="rounded-full h-12 w-12"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
