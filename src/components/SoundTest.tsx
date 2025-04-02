import { useState } from 'react';
import { Button } from './ui/button';
import { Volume2 } from 'lucide-react';

export function SoundTest() {
  const [isPlaying, setIsPlaying] = useState(false);

  const playSound = async () => {
    setIsPlaying(true);
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 1.0;
      
      audio.onended = () => {
        setIsPlaying(false);
      };

      await audio.play();
    } catch (error) {
      console.error('Erro ao tocar som:', error);
      // Método alternativo
      try {
        const audioElement = document.createElement('audio');
        audioElement.src = '/notification-sound.mp3';
        audioElement.volume = 1.0;
        
        audioElement.onended = () => {
          setIsPlaying(false);
          document.body.removeChild(audioElement);
        };

        document.body.appendChild(audioElement);
        await audioElement.play();
      } catch (fallbackError) {
        console.error('Erro no método alternativo:', fallbackError);
      }
      setIsPlaying(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={playSound}
      disabled={isPlaying}
      className="w-full"
    >
      <Volume2 className="mr-2 h-4 w-4" />
      {isPlaying ? 'Tocando...' : 'Testar Som'}
    </Button>
  );
} 