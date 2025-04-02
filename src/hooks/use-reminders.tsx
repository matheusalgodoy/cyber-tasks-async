import { useEffect, useState, useCallback, useRef } from "react";
import { Task } from "@/components/TaskItem";
import { useToast } from "./use-toast";

// Interface para configurações
interface NotificationSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  advanceReminder: number;
}

const getDefaultSettings = (): NotificationSettings => ({
  notificationsEnabled: false,
  soundEnabled: true,
  advanceReminder: 15
});

// Verificar se o aplicativo está rodando como PWA standalone
const isPWA = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
};

// Hook para gerenciar lembretes
export function useReminders(tasks: Task[]) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(getDefaultSettings());
  const tasksRef = useRef<Task[]>(tasks);
  const remindersRef = useRef<Record<string, number>>({});
  const checkIntervalRef = useRef<number | null>(null);
  
  // Carregar configurações salvas (uma vez na montagem)
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("taskNotificationSettings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          notificationsEnabled: parsed.notificationsEnabled ?? false,
          soundEnabled: parsed.soundEnabled ?? true,
          advanceReminder: parsed.advanceReminder ?? 15
        });
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
    
    // Limpar intervalo ao desmontar
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);
  
  // Manter referência atualizada
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  
  // Atualizar configurações
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(current => {
      const updated = { ...current, ...newSettings };
      localStorage.setItem("taskNotificationSettings", JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  // Enviar notificação
  const showNotification = useCallback((title: string, body: string) => {
    // Sempre mostrar toast
    toast({
      title,
      description: body,
      duration: 10000,
    });
    
    // Tentar notificação nativa se possível
    if (settings.soundEnabled) {
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.7;
        audio.play().catch(() => {
          // Fallback
          const audioEl = document.createElement('audio');
          audioEl.src = '/notification-sound.mp3';
          audioEl.volume = 0.7;
          document.body.appendChild(audioEl);
          audioEl.play().finally(() => {
            setTimeout(() => {
              try {
                document.body.removeChild(audioEl);
              } catch (e) {}
            }, 2000);
          });
        });
      } catch (error) {
        console.error("Erro ao tocar som:", error);
      }
    }
    
    // Notificação nativa
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: '/pwa-icon-192.png',
        });
      } catch (e) {
        console.error("Erro ao mostrar notificação:", e);
      }
    }
  }, [toast, settings.soundEnabled]);
  
  // Limpar todos os lembretes
  const clearAllReminders = useCallback(() => {
    Object.values(remindersRef.current).forEach(id => {
      try {
        clearTimeout(id);
      } catch (e) {}
    });
    remindersRef.current = {};
  }, []);
  
  // Verificar se estamos no PWA
  const isPwa = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches;
  }, []);
  
  // Verificar se estamos no iOS
  const isIOS = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }, []);
  
  // Configurar lembretes e verificar se é hora de mostrar notificações
  useEffect(() => {
    // Não fazer nada se notificações estão desativadas
    if (!settings.notificationsEnabled) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }
    
    // Verificar tarefas com lembretes
    const checkForReminders = () => {
      const now = new Date();
      const currentTasks = tasksRef.current;
      
      currentTasks.forEach(task => {
        if (!task.reminder || task.completed || !task.dueDate) return;
        
        // Calcular o momento do lembrete
        const dueDate = new Date(task.dueDate);
        if (task.dueTime) {
          const [hours, minutes] = task.dueTime.split(':').map(Number);
          dueDate.setHours(hours, minutes, 0, 0);
        } else {
          dueDate.setHours(9, 0, 0, 0);
        }
        
        const reminderTime = new Date(dueDate.getTime() - (settings.advanceReminder * 60 * 1000));
        
        // Verificar se está dentro de uma margem de 1 minuto do horário do lembrete
        const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
        if (timeDiff < 60000) { // Dentro de 1 minuto
          // Gerar ID único para este lembrete para evitar duplicação
          const reminderKey = `${task.id}_${reminderTime.getTime()}`;
          
          // Verificar se já mostramos esta notificação recentemente
          const notificationShown = localStorage.getItem(reminderKey);
          if (!notificationShown) {
            // Mostrar notificação
            const title = "Lembrete de Tarefa";
            const body = `A tarefa "${task.title}" vence ${task.dueTime ? "hoje às " + task.dueTime : "hoje"}!`;
            showNotification(title, body);
            
            // Marcar como mostrada por 2 minutos
            localStorage.setItem(reminderKey, 'shown');
            setTimeout(() => {
              localStorage.removeItem(reminderKey);
            }, 120000); // 2 minutos
          }
        }
      });
    };
    
    // Verificar imediatamente
    checkForReminders();
    
    // Configurar verificação periódica (a cada 30 segundos)
    if (!checkIntervalRef.current) {
      checkIntervalRef.current = window.setInterval(checkForReminders, 30000);
    }
    
    // Limpar intervalo ao desmontar ou quando as configurações mudarem
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [settings.notificationsEnabled, settings.advanceReminder, showNotification]);

  return {
    settings,
    updateSettings,
    showNotification,
    clearAllReminders,
    isPwa: isPwa(),
    isIOS: isIOS()
  };
} 