import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface CameraFeedProps {
  isAlert?: boolean;
}

export const CameraFeed = ({ isAlert = false }: CameraFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsActive(true);
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <Card className={`overflow-hidden ${isAlert ? 'border-destructive border-2' : ''}`}>
      <div className="relative aspect-video bg-muted">
        {isActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CameraOff className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          {isAlert && (
            <div className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-medium">
              ALERT
            </div>
          )}
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </div>
      <div className="p-4 flex justify-center gap-2">
        {isActive ? (
          <Button onClick={stopCamera} variant="outline" size="sm">
            <CameraOff className="h-4 w-4 mr-2" />
            Stop Camera
          </Button>
        ) : (
          <Button onClick={startCamera} size="sm">
            <Camera className="h-4 w-4 mr-2" />
            Start Camera
          </Button>
        )}
      </div>
    </Card>
  );
};
