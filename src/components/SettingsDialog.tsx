import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useReminders } from "@/hooks/use-reminders";
import { useForm } from "react-hook-form";
import { Task } from "@/components/TaskItem";

interface SettingsProps {
  tasks: Task[];
}

function SettingsDialogComponent({ tasks }: SettingsProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { settings, updateSettings, isPwa, isIOS, showNotification } = useReminders(tasks);
  
  // Configurações de formulário - mantenha estável na montagem do componente
  const form = useForm({
    defaultValues: settings
  });
  
  // Atualizar form quando as configurações mudarem significativamente
  useEffect(() => {
    if (form.getValues().notificationsEnabled !== settings.notificationsEnabled ||
        form.getValues().soundEnabled !== settings.soundEnabled ||
        form.getValues().advanceReminder !== settings.advanceReminder) {
      form.reset(settings);
    }
  }, [settings, form]);
  
  // Solicitar permissão para notificações - memoizar para evitar re-renders
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Erro",
        description: "Seu navegador não suporta notificações.",
        variant: "destructive"
      });
      return;
    }
    
    if (Notification.permission === "granted") {
      toast({
        title: "Permissão já concedida",
        description: "Você já permitiu as notificações para este site."
      });
      updateSettings({ notificationsEnabled: true });
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast({
          title: "Permissão concedida",
          description: "Agora você receberá notificações para suas tarefas."
        });
        updateSettings({ notificationsEnabled: true });
      } else {
        toast({
          title: "Permissão negada",
          description: "Você negou a permissão para notificações.",
          variant: "destructive"
        });
        updateSettings({ notificationsEnabled: false });
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível solicitar permissão.",
        variant: "destructive"
      });
    }
  }, [toast, updateSettings]);
  
  // Testar uma notificação - memoizar para evitar re-renders
  const testNotification = useCallback(() => {
    showNotification("Notificação de teste", "Esta é uma notificação de teste.");
  }, [showNotification]);
  
  // Salvar as configurações - memoizar para evitar re-renders
  const onSubmit = useCallback((data: any) => {
    updateSettings({
      notificationsEnabled: data.notificationsEnabled,
      soundEnabled: data.soundEnabled,
      advanceReminder: data.advanceReminder
    });
    
    toast({
      title: "Configurações salvas",
      description: "Suas preferências de notificação foram atualizadas."
    });
    
    setOpen(false);
  }, [updateSettings, toast]);
  
  // Ao abrir o diálogo, garantir que o formulário tenha valores atualizados
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      form.reset(settings);
    }
  }, [form, settings]);
  
  // Renderizar componente
  const settingsIcon = (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="h-[1.2rem] w-[1.2rem]"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          {settingsIcon}
          <span className="sr-only">Configurações</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações de Notificação</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Habilitar notificações */}
              <FormField
                control={form.control}
                name="notificationsEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Notificações</FormLabel>
                      <FormDescription>
                        Receba lembretes para suas tarefas
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          if (checked && Notification.permission !== "granted") {
                            requestPermission();
                          } else {
                            field.onChange(checked);
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Som de notificação */}
              <FormField
                control={form.control}
                name="soundEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Som</FormLabel>
                      <FormDescription>
                        Tocar som ao receber notificações
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Tempo de antecedência */}
              <FormField
                control={form.control}
                name="advanceReminder"
                render={({ field }) => (
                  <FormItem className="space-y-4 rounded-lg border p-4">
                    <div>
                      <FormLabel className="text-base">Lembrete com antecedência</FormLabel>
                      <FormDescription>
                        Receba lembretes antes do prazo da tarefa
                      </FormDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <FormControl>
                        <Slider
                          min={5}
                          max={60}
                          step={5}
                          defaultValue={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                      <span className="w-12 text-sm">{field.value} min</span>
                    </div>
                  </FormItem>
                )}
              />
              
              {/* Botão para testar notificação */}
              <div className="rounded-lg border p-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={testNotification}
                  className="w-full"
                >
                  Testar Notificação
                </Button>
              </div>
              
              {/* Informações sobre PWA */}
              {!isPwa && !isIOS && (
                <div className="rounded-lg border p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Dica:</h4>
                  <p className="text-sm text-muted-foreground">
                    Para melhor experiência com notificações, instale este aplicativo como um app (PWA).
                  </p>
                </div>
              )}
              
              {/* Informações para iOS */}
              {isIOS && (
                <div className="rounded-lg border p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Nota para iOS:</h4>
                  <p className="text-sm text-muted-foreground">
                    Para receber notificações no iOS, adicione este site à tela inicial primeiro.
                  </p>
                </div>
              )}
            </div>
            
            <Button type="submit" className="w-full">Salvar Configurações</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Memoizar o componente para evitar re-renderizações desnecessárias
export const SettingsDialog = memo(SettingsDialogComponent); 