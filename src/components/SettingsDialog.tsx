import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Input } from "./ui/input";
import { Settings, Bell, Volume2, Info } from "lucide-react";
import { useReminders } from "@/hooks/use-reminders";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [advanceReminder, setAdvanceReminder] = useState(15);
  const [permissionStatus, setPermissionStatus] = useState<string>("");
  const [isIOS, setIsIOS] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);

  // Verificar se está rodando como PWA
  const { isPwa } = useReminders([]);

  // Detectar se é iOS
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    }
  }, []);

  // Verificar a permissão atual de notificação
  const checkNotificationPermission = () => {
    if (typeof window === 'undefined' || !("Notification" in window)) {
      setPermissionStatus("not-supported");
      return "not-supported";
    }
    
    const permission = Notification.permission;
    console.log("Permissão atual:", permission);
    setPermissionStatus(permission);
    return permission;
  };

  // Solicitar permissão para notificações
  const requestNotificationPermission = async () => {
    console.log("Solicitando permissão para notificações...");
    
    // Se estiver em iOS, apenas ativar as notificações do app
    // já que notificações nativas são limitadas no Safari iOS
    if (isIOS) {
      setNotificationsEnabled(true);
      saveSettings(true, soundEnabled, advanceReminder);
      toast({
        title: "Notificações ativadas",
        description: "Lembretes serão exibidos usando notificações internas.",
      });
      return "granted";
    }
    
    try {
      if (typeof window !== 'undefined' && "Notification" in window) {
        // No caso de já ter permissão, apenas ativar
        if (Notification.permission === "granted") {
          setNotificationsEnabled(true);
          saveSettings(true, soundEnabled, advanceReminder);
          toast({
            title: "Notificações ativadas",
            description: "Você receberá notificações de lembretes de tarefas.",
          });
          return "granted";
        }
        
        // Solicitar permissão se ainda não decidiu
        if (Notification.permission === "default") {
          try {
            const permission = await Notification.requestPermission();
            console.log("Resultado da solicitação de permissão:", permission);
            setPermissionStatus(permission);
            
            if (permission === "granted") {
              setNotificationsEnabled(true);
              saveSettings(true, soundEnabled, advanceReminder);
              toast({
                title: "Notificações ativadas",
                description: "Você receberá notificações de lembretes de tarefas.",
              });
            } else {
              setNotificationsEnabled(false);
              saveSettings(false, soundEnabled, advanceReminder);
              toast({
                title: "Permissão de notificação negada",
                description: "Permita notificações nas configurações do navegador para receber lembretes.",
                variant: "destructive",
              });
            }
            
            return permission;
          } catch (error) {
            console.error("Erro ao solicitar permissão:", error);
            toast({
              title: "Erro",
              description: "Não foi possível solicitar permissão para notificações.",
              variant: "destructive",
            });
            return "denied";
          }
        }
        
        // Se permissão já negada anteriormente
        if (Notification.permission === "denied") {
          toast({
            title: "Permissão bloqueada",
            description: "As notificações estão bloqueadas. Verifique as configurações do seu navegador.",
            variant: "destructive",
          });
          return "denied";
        }
      } else {
        // Navegador não suporta notificações
        toast({
          title: "Não suportado",
          description: "Seu navegador não suporta notificações nativas. Usaremos notificações internas.",
        });
        // Mesmo assim, ativamos as notificações para usar o fallback
        setNotificationsEnabled(true);
        saveSettings(true, soundEnabled, advanceReminder);
        return "not-supported";
      }
    } catch (error) {
      console.error("Erro ao gerenciar notificações:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao ativar as notificações.",
        variant: "destructive",
      });
    }
    
    return Notification.permission || "denied";
  };

  // Alternar notificações com tratamento adequado
  const handleNotificationToggle = (checked: boolean) => {
    console.log("Alternar notificações:", checked);
    
    if (checked) {
      // Se está ativando, solicitar permissão
      requestNotificationPermission();
    } else {
      // Se está desativando, apenas desligar
      setNotificationsEnabled(false);
      saveSettings(false, soundEnabled, advanceReminder);
      toast({
        title: "Notificações desativadas",
        description: "Você não receberá mais lembretes de tarefas.",
      });
    }
  };

  // Salvar configurações no localStorage
  const saveSettings = (
    notifications: boolean,
    sound: boolean,
    advance: number
  ) => {
    const settings = {
      notificationsEnabled: notifications,
      soundEnabled: sound,
      advanceReminder: advance,
    };
    
    try {
      localStorage.setItem("taskNotificationSettings", JSON.stringify(settings));
      console.log("Configurações salvas:", settings);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    }
  };

  // Carregar configurações ao abrir o componente
  useEffect(() => {
    if (!open) return;
    
    try {
      const savedSettings = localStorage.getItem("taskNotificationSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setNotificationsEnabled(settings.notificationsEnabled ?? false);
        setSoundEnabled(settings.soundEnabled ?? true);
        setAdvanceReminder(settings.advanceReminder ?? 15);
      }
      
      // Verificar a permissão atual
      checkNotificationPermission();
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  }, [open]);

  // Mostrar notificação de teste
  const showTestNotification = () => {
    // Verificar se notificações são suportadas pelo navegador
    const notificationsSupported = typeof window !== 'undefined' && "Notification" in window;
    
    if (!notificationsSupported) {
      // Se não suportar notificações nativas, usar apenas toast
      toast({
        title: "Teste de notificação",
        description: "Seu navegador não suporta notificações nativas. Usando toast como alternativa.",
        duration: 4000,
      });
      return;
    }
    
    // Se suportar mas não tiver permissão, informar ao usuário
    if (Notification.permission !== "granted") {
      toast({
        title: "Permissão negada",
        description: "Você precisa permitir notificações primeiro.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Mostrar um toast (funcionará em qualquer dispositivo)
      toast({
        title: "Notificação de teste",
        description: "Esta é uma notificação de teste.",
        duration: 4000,
      });
      
      // Atrasar a notificação do sistema para evitar problemas
      setTimeout(() => {
        try {
          // Mostrar uma notificação do sistema
          new Notification("Notificação de teste", {
            body: "Esta é uma notificação de teste para lembretes de tarefas.",
            icon: "/notification-icon.svg",
          });
        } catch (innerError) {
          console.error("Erro ao criar notificação:", innerError);
        }
        
        // Tocar som se estiver habilitado, com um pequeno atraso
        if (soundEnabled) {
          setTimeout(() => {
            const audio = new Audio("/notification-sound.mp3");
            audio.play().catch((error) => {
              console.error("Erro ao reproduzir som:", error);
            });
          }, 200);
        }
      }, 500);
    } catch (error) {
      console.error("Erro ao mostrar notificação de teste:", error);
      toast({
        title: "Erro",
        description: "Não foi possível mostrar a notificação de teste.",
        variant: "destructive",
      });
    }
  };

  // Atualizar as configurações quando os valores mudarem
  useEffect(() => {
    // Não salvar durante a inicialização ou quando o diálogo está fechado
    if (!open) return;
    
    const currentStatus = checkNotificationPermission();
    if (currentStatus === "denied" && notificationsEnabled) {
      // Se permissão negada mas notificações habilitadas, desabilitar
      setNotificationsEnabled(false);
      return;
    }
    
    saveSettings(notificationsEnabled, soundEnabled, advanceReminder);
  }, [notificationsEnabled, soundEnabled, advanceReminder, open]);

  // Função para testar o som de notificação
  const testNotificationSound = () => {
    try {
      // Usando new Audio, carregando e reproduzindo
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 1.0; // Volume máximo para teste
        audio.play()
          .then(() => {
            console.log("Som reproduzido com sucesso");
            toast({
              title: "Som de notificação",
              description: "Som reproduzido com sucesso",
              duration: 3000,
            });
          })
          .catch(error => {
            console.error("Erro ao reproduzir som (método 1):", error);
            // Tentar método alternativo
            fallbackAudioPlay();
          });
      } catch (error) {
        console.error("Erro ao usar Audio API (método 1):", error);
        // Tentar método alternativo
        fallbackAudioPlay();
      }
    } catch (error) {
      console.error("Erro ao criar objeto de áudio:", error);
      toast({
        title: "Erro",
        description: "Não foi possível reproduzir o som. Verifique o volume.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  // Método alternativo usando elemento HTML
  const fallbackAudioPlay = () => {
    try {
      // Criar elemento de áudio e adicionar à página
      const audioElement = document.createElement('audio');
      audioElement.src = '/notification-sound.mp3';
      audioElement.volume = 1.0;
      
      // Definir eventos
      audioElement.onplay = () => console.log("Reprodução iniciada (método 2)");
      audioElement.onerror = (e) => console.error("Erro ao reproduzir (método 2):", e);
      
      // Adicionar ao DOM temporariamente
      document.body.appendChild(audioElement);
      
      // Reproduzir e depois remover
      audioElement.play()
        .then(() => {
          console.log("Som reproduzido com método alternativo");
          toast({
            title: "Som de notificação",
            description: "Som reproduzido com sucesso (método alternativo)",
            duration: 3000,
          });
        })
        .catch(error => {
          console.error("Erro ao reproduzir som (método 2):", error);
          toast({
            title: "Erro",
            description: "Não foi possível reproduzir o som usando métodos alternativos.",
            variant: "destructive",
            duration: 3000,
          });
        })
        .finally(() => {
          // Remover o elemento após uso
          setTimeout(() => {
            document.body.removeChild(audioElement);
          }, 2000);
        });
    } catch (error) {
      console.error("Erro no método alternativo:", error);
    }
  };

  // Testar notificação
  const testNotification = async () => {
    setTestingNotification(true);
    
    try {
      let notificationTitle = "Teste de Notificação";
      let notificationBody = "Esta é uma notificação de teste.";
      
      // Verificar permissões nativas para navegadores desktop
      if (!isIOS && "Notification" in window) {
        if (Notification.permission !== "granted" && Notification.permission !== "denied") {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            setPermissionStatus("granted");
          } else {
            setPermissionStatus(permission);
            toast({
              title: "Permissão não concedida",
              description: "As notificações podem não funcionar corretamente.",
              variant: "destructive",
            });
          }
        }
        
        // Mostrar notificação nativa se tiver permissão
        if (Notification.permission === "granted") {
          try {
            new Notification(notificationTitle, {
              body: notificationBody,
              icon: "/pwa-icon-192.png",
            });
          } catch (error) {
            console.error("Erro ao exibir notificação nativa:", error);
          }
        }
      }
      
      // Mostrar toast para todos os casos (fallback)
      toast({
        title: notificationTitle,
        description: notificationBody,
        duration: 5000,
      });
      
      // Tocar som se estiver habilitado
      if (soundEnabled) {
        testNotificationSound();
      }
      
    } catch (error) {
      console.error("Erro ao testar notificação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível testar a notificação",
        variant: "destructive",
      });
    } finally {
      setTestingNotification(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações
            {isPwa && (
              <span className="text-xs bg-slate-900/20 text-slate-900 dark:text-slate-200 dark:bg-slate-900/40 px-2 py-0.5 rounded text-[10px] font-medium">
                PWA
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {isIOS && (
            <div className="rounded-md bg-yellow-500/20 p-3 text-sm">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-500">Nota para usuários de iOS</p>
                  <p className="mt-1 text-yellow-500/90">
                    As notificações em navegadores no iOS são limitadas. Usaremos notificações internas (toasts) como alternativa para garantir que você receba lembretes.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Configuração de Notificações */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <Label
                htmlFor="notifications"
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Notificações
              </Label>
              <span className="text-xs text-muted-foreground">
                Receba lembretes antes do prazo
              </span>
            </div>
            {permissionStatus === "denied" ? (
              <Button variant="outline" onClick={requestNotificationPermission}>
                Permitir Notificações
              </Button>
            ) : (
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            )}
          </div>
          
          {/* Configuração de Som */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4" />
                <Label htmlFor="soundEnabled">Som de Notificação</Label>
              </div>
              <Switch
                id="soundEnabled"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {isIOS
                ? "Dispositivos iOS podem não reproduzir sons automaticamente. Você pode testar abaixo."
                : "Reproduz um som quando uma notificação é exibida."}
            </p>
            
            {/* Botão para testar o som */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={testNotificationSound}
              disabled={!soundEnabled}
              className="mt-2"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Testar Som
            </Button>
          </div>
          
          {/* Configuração de Tempo de Antecedência */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="advanceTime">
              Tempo de antecedência (minutos)
            </Label>
            <Input
              id="advanceTime"
              type="number"
              min="1"
              max="60"
              value={advanceReminder}
              onChange={(e) => setAdvanceReminder(Number(e.target.value))}
              disabled={!notificationsEnabled}
            />
            <span className="text-xs text-muted-foreground">
              Quanto tempo antes do prazo você deseja ser lembrado
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 