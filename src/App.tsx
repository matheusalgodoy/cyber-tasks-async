import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

const queryClient = new QueryClient();

// Componente para exibir o prompt de instalação do PWA
const PWAInstallPrompt = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installEvent, setInstallEvent] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iOS);
    
    // Escutar o evento beforeinstallprompt para navegadores que o suportam
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir o diálogo automático do Chrome
      e.preventDefault();
      // Armazenar o evento para uso posterior
      setInstallEvent(e);
      // Mostrar o nosso prompt personalizado
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar se o app já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installEvent) return;
    
    // Mostrar o prompt de instalação
    installEvent.prompt();
    
    // Aguardar a escolha do usuário
    installEvent.userChoice.then((choiceResult: {outcome: string}) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou a instalação');
      } else {
        console.log('Usuário recusou a instalação');
      }
      // Limpar o evento
      setInstallEvent(null);
      setShowInstallPrompt(false);
    });
  };

  if (!showInstallPrompt && !isIOS) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 bg-card/90 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex-1">
          <h3 className="font-medium">Instale o Cyber Tasks</h3>
          <p className="text-sm text-muted-foreground">
            {isIOS 
              ? 'Toque em "Compartilhar" e depois "Adicionar à Tela de Início"' 
              : 'Instale para uso offline e notificações melhores'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isIOS && (
            <button 
              onClick={handleInstallClick}
              className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-1"
            >
              <Download className="w-4 h-4" /> Instalar
            </button>
          )}
          <button 
            onClick={() => setShowInstallPrompt(false)}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark">
      <TooltipProvider>
        <div className="min-h-screen w-full bg-black text-white">
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <PWAInstallPrompt />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
