import { useEffect, useState, useCallback, useRef } from "react";
import { Task } from "@/components/TaskItem";
import { useToast } from "./use-toast";

// Interface para configurações
interface NotificationSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  advanceReminder: number;
}

// Verificar se o aplicativo está rodando como PWA standalone
const isPWA = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
};

// Hook para gerenciar lembretes
export function useReminders(tasks: Task[]) {
  const { toast } = useToast();
  const [activeReminders, setActiveReminders] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<NotificationSettings>({
    notificationsEnabled: false,
    soundEnabled: true,
    advanceReminder: 15
  });
  
  // Referência para evitar loops infinitos
  const settingsRef = useRef(settings);
  const activeRemindersRef = useRef(activeReminders);
  const tasksRef = useRef(tasks);
  
  // Atualizar as referências quando os valores mudarem
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  
  useEffect(() => {
    activeRemindersRef.current = activeReminders;
  }, [activeReminders]);
  
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  
  // Carregar configurações do usuário
  const loadSettings = useCallback(() => {
    try {
      const savedSettings = localStorage.getItem("taskNotificationSettings");
      
      // Se não houver configurações salvas, criar padrão
      if (!savedSettings) {
        const defaultSettings = {
          notificationsEnabled: false,
          soundEnabled: true,
          advanceReminder: 15
        };
        
        // Salvar as configurações padrão
        localStorage.setItem("taskNotificationSettings", JSON.stringify(defaultSettings));
        console.log("Configurações padrão criadas:", defaultSettings);
        
        setSettings(defaultSettings);
        return defaultSettings;
      }
      
      // Caso contrário, usar as configurações salvas
      const parsedSettings = JSON.parse(savedSettings);
      console.log("Carregando configurações:", parsedSettings);
      
      // Garantir que todos os campos existam
      const validatedSettings = {
        notificationsEnabled: parsedSettings.notificationsEnabled ?? false,
        soundEnabled: parsedSettings.soundEnabled ?? true,
        advanceReminder: parsedSettings.advanceReminder ?? 15
      };
      
      setSettings(validatedSettings);
      return validatedSettings;
    } catch (error) {
      console.error("Erro ao carregar configurações de notificação:", error);
      
      // Em caso de erro, usar valores padrão
      const defaultSettings = {
        notificationsEnabled: false,
        soundEnabled: true,
        advanceReminder: 15
      };
      
      setSettings(defaultSettings);
      return defaultSettings;
    }
  }, []);
  
  // Verificar se a notificação é suportada e tem permissão
  const canUseNativeNotifications = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const notificationsSupported = 'Notification' in window;
    const hasPermission = notificationsSupported && Notification.permission === 'granted';
    
    // No PWA, as notificações funcionam melhor
    const isPwaMode = isPWA();
    
    return notificationsSupported && hasPermission && (isPwaMode || !isIOS());
  }, []);
  
  // Detectar se é iOS
  const isIOS = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }, []);
  
  // Carregar configurações iniciais
  useEffect(() => {
    loadSettings();
    
    // Verificar permissão de notificação apenas se a API existir
    if (typeof window !== 'undefined' && "Notification" in window) {
      console.log("Status de permissão de notificação:", Notification.permission);
      console.log("PWA mode:", isPWA() ? "Sim" : "Não");
    }
  }, [loadSettings]);
  
  // Registrar lembretes com a Notification API
  const scheduleNotification = useCallback((title: string, body: string, timestamp: number) => {
    const currentTime = Date.now();
    const delay = timestamp - currentTime;
    
    // Se o tempo já passou, não agendar
    if (delay <= 0) return -1;
    
    // Criar um timer para mostrar a notificação no momento certo
    return window.setTimeout(() => {
      // Mostrar a notificação nativa se possível
      if (canUseNativeNotifications()) {
        try {
          const notification = new Notification(title, {
            body,
            icon: '/pwa-icon-192.png',
            badge: '/pwa-icon-192.png',
            vibrate: [200, 100, 200]
          });
          
          // No PWA, podemos adicionar ações à notificação
          if (isPWA()) {
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          }
        } catch (error) {
          console.error("Erro ao mostrar notificação:", error);
        }
      }
      
      // Sempre mostrar o toast como backup
      toast({
        title,
        description: body,
        duration: 10000,
      });
      
      // Tocar som se habilitado
      if (settingsRef.current.soundEnabled) {
        playNotificationSound();
      }
    }, delay);
  }, [toast, canUseNativeNotifications]);
  
  // Limpar todos os reminders existentes
  const clearAllReminders = useCallback(() => {
    console.log("Limpando todos os lembretes...");
    Object.values(activeRemindersRef.current).forEach(timerId => {
      clearTimeout(timerId);
    });
    setActiveReminders({});
  }, []);
  
  // Tocar um som de notificação
  const playNotificationSound = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Método 1: Abordagem direta
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 1.0;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Som de notificação reproduzido com sucesso");
            })
            .catch(error => {
              console.error("Falha ao reproduzir som (método 1):", error);
              // Se falhar, tentar o método alternativo
              useAlternativeAudioMethod();
            });
        }
      } catch (error) {
        console.error("Erro ao criar ou reproduzir áudio (método 1):", error);
        // Se lançar exceção, tentar o método alternativo
        useAlternativeAudioMethod();
      }
    } catch (error) {
      console.error("Erro ao tocar som de notificação:", error);
    }
  }, []);
  
  // Método alternativo de reprodução de áudio usando elemento HTML
  const useAlternativeAudioMethod = useCallback(() => {
    try {
      const audioElement = document.createElement('audio');
      audioElement.src = '/notification-sound.mp3';
      audioElement.volume = 1.0;
      
      // Eventos para depuração
      audioElement.onplay = () => console.log("Reprodução iniciada (método alternativo)");
      audioElement.onerror = (e) => console.error("Erro na reprodução (método alternativo):", e);
      
      // Adicionar temporariamente ao DOM (necessário em alguns navegadores móveis)
      document.body.appendChild(audioElement);
      
      // Reproduzir e depois remover
      audioElement.play()
        .catch(error => {
          console.error("Falha ao reproduzir som (método alternativo):", error);
        })
        .finally(() => {
          // Remover o elemento após o uso
          setTimeout(() => {
            try {
              document.body.removeChild(audioElement);
            } catch (e) {
              console.error("Erro ao remover elemento de áudio:", e);
            }
          }, 2000);
        });
    } catch (error) {
      console.error("Erro no método alternativo de áudio:", error);
    }
  }, []);
  
  // Configurar um novo reminder
  const setupReminder = useCallback((task: Task) => {
    if (!task.dueDate || !task.reminder || task.completed) return;
    if (typeof window === 'undefined') return;
    
    const currentSettings = settingsRef.current;
    
    if (!currentSettings.notificationsEnabled) {
      console.log(`Notificações desativadas, ignorando lembrete para tarefa "${task.title}"`);
      return;
    }
    
    // Construir a data/hora de vencimento
    const dueDate = new Date(task.dueDate);
    if (task.dueTime) {
      const [hours, minutes] = task.dueTime.split(':').map(Number);
      dueDate.setHours(hours, minutes, 0, 0);
    } else {
      dueDate.setHours(9, 0, 0, 0); // Padrão: 9:00 AM
    }
    
    // Calcular quanto tempo falta para o lembrete
    const reminderTime = new Date(dueDate.getTime() - (currentSettings.advanceReminder * 60 * 1000));
    const reminderTimestamp = reminderTime.getTime();
    
    // Se já passou, não configurar
    if (reminderTimestamp <= Date.now()) {
      console.log(`Tempo para lembrete já passou para tarefa "${task.title}"`);
      return;
    }
    
    // Preparar mensagem de notificação
    const title = "Lembrete de Tarefa";
    const body = `A tarefa "${task.title}" vence ${task.dueTime ? "hoje às " + task.dueTime : "hoje"}!`;
    
    // Agendar a notificação
    const timerId = scheduleNotification(title, body, reminderTimestamp);
    
    if (timerId !== -1) {
      // Armazenar o ID do timer
      setActiveReminders(prev => ({
        ...prev,
        [task.id]: timerId
      }));
      
      console.log(`Lembrete agendado para "${task.title}" às ${reminderTime.toLocaleString()}`);
    }
  }, [scheduleNotification]);
  
  // Limpar timeout ao remover uma tarefa
  const clearReminderForTask = useCallback((taskId: string) => {
    const timerId = activeRemindersRef.current[taskId];
    if (timerId) {
      clearTimeout(timerId);
      setActiveReminders(prev => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
    }
  }, []);
  
  // Configurar lembretes para todas as tarefas
  const setupReminders = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Limpar lembretes existentes primeiro
    Object.values(activeRemindersRef.current).forEach(timerId => {
      clearTimeout(timerId);
    });
    setActiveReminders({});
    
    // Verificar se notificações estão habilitadas nas configurações
    const notificationsEnabled = settingsRef.current.notificationsEnabled;
    
    // Configurar lembretes para todas as tarefas não concluídas
    if (notificationsEnabled) {
      console.log(`Configurando lembretes para ${tasksRef.current.length} tarefa(s)`);
      tasksRef.current.forEach(task => {
        if (task.reminder && !task.completed) {
          setupReminder(task);
        }
      });
    }
  }, [setupReminder]);
  
  // Verificar mudanças nas configurações (uma vez na inicialização)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Primeira verificação
    loadSettings();
    
    // Configurar lembretes
    setupReminders();
    
    // Verificar periodicamente por mudanças
    const checkSettingsInterval = setInterval(() => {
      try {
        const savedSettings = localStorage.getItem("taskNotificationSettings");
        if (!savedSettings) return;
        
        const parsedSettings = JSON.parse(savedSettings);
        const currentSettings = settingsRef.current;
        
        const hasChanged = 
          parsedSettings.notificationsEnabled !== currentSettings.notificationsEnabled ||
          parsedSettings.soundEnabled !== currentSettings.soundEnabled ||
          parsedSettings.advanceReminder !== currentSettings.advanceReminder;
          
        if (hasChanged) {
          setSettings({
            notificationsEnabled: parsedSettings.notificationsEnabled ?? false,
            soundEnabled: parsedSettings.soundEnabled ?? true,
            advanceReminder: parsedSettings.advanceReminder ?? 15
          });
        }
      } catch (error) {
        console.error("Erro ao verificar configurações:", error);
      }
    }, 10000); // Verificar a cada 10 segundos
    
    return () => {
      clearInterval(checkSettingsInterval);
      // Limpar todos os lembretes ao desmontar
      Object.values(activeRemindersRef.current).forEach(clearTimeout);
    };
  }, [loadSettings, setupReminders]);
  
  // Reconfigurar lembretes quando as tarefas ou configurações de notificação mudam
  useEffect(() => {
    setupReminders();
  }, [tasks, settings.notificationsEnabled, settings.advanceReminder, setupReminders]);
  
  return {
    activeReminders,
    setupReminder,
    clearReminderForTask,
    clearAllReminders,
    settings,
    isPwa: isPWA()
  };
} 