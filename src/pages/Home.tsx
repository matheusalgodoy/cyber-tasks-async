import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import TaskList from "@/components/TaskList";
import { Task } from "@/components/TaskItem";
import { v4 as uuidv4 } from "uuid";
import { useReminders } from "@/hooks/use-reminders";
import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { SettingsDialog } from "@/components/SettingsDialog";

const STORAGE_KEY = "cyberTasks";

const Home = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { clearReminderForTask } = useReminders(tasks);
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Solicitar permissão para notificações no carregamento inicial
  useEffect(() => {
    const checkAndRequestNotifications = async () => {
      if ('Notification' in window) {
        // Verificar se tem configurações salvas
        const savedSettings = localStorage.getItem("taskNotificationSettings");
        let notificationsEnabled = false;
        
        if (savedSettings) {
          try {
            const settings = JSON.parse(savedSettings);
            notificationsEnabled = settings.notificationsEnabled;
          } catch (error) {
            console.error("Erro ao analisar configurações:", error);
          }
        }
        
        // Se o usuário ainda não decidiu e notificações estão ativadas nas configurações
        if (Notification.permission === "default" && notificationsEnabled) {
          console.log("Solicitando permissão de notificação na inicialização...");
          try {
            const permission = await Notification.requestPermission();
            console.log("Permissão obtida:", permission);
            
            // Se a permissão foi negada, desativar notificações nas configurações
            if (permission === "denied" && savedSettings) {
              const settings = JSON.parse(savedSettings);
              settings.notificationsEnabled = false;
              localStorage.setItem("taskNotificationSettings", JSON.stringify(settings));
              toast({
                title: "Notificações Desativadas",
                description: "As notificações foram desativadas porque você negou a permissão.",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error("Erro ao solicitar permissão:", error);
          }
        }
      }
    };
    
    checkAndRequestNotifications();
  }, [toast]);

  // Carregar tarefas do localStorage no montagem do componente
  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
        console.log(`${parsedTasks.length} tarefas carregadas do armazenamento local`);
      } catch (error) {
        console.error("Falha ao analisar tarefas do localStorage:", error);
        setTasks([]);
      }
    }
  }, []);

  // Salvar tarefas no localStorage quando as tarefas mudam
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const formatDate = () => {
    const today = new Date();
    return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  };

  const addTask = (taskData: Omit<Task, "id">) => {
    const newTask: Task = {
      id: uuidv4(),
      ...taskData,
      createdAt: formatDate()
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    
    // Notificar o usuário sobre tarefa criada com sucesso
    toast({
      title: "Tarefa Criada",
      description: `A tarefa "${newTask.title}" foi criada com sucesso.`
    });
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
    );
    
    // Notificar o usuário sobre tarefa atualizada
    toast({
      title: "Tarefa Atualizada",
      description: `A tarefa "${updatedTask.title}" foi atualizada.`
    });
  };

  const toggleTaskComplete = (id: string) => {
    let taskTitle = "";
    let wasCompleted = false;
    
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === id) {
          taskTitle = task.title;
          wasCompleted = task.completed;
          return { ...task, completed: !task.completed };
        }
        return task;
      })
    );
    
    // Notificar o usuário sobre a mudança no status da tarefa
    toast({
      title: wasCompleted ? "Tarefa Reaberta" : "Tarefa Concluída",
      description: `A tarefa "${taskTitle}" foi ${wasCompleted ? "reaberta" : "marcada como concluída"}.`
    });
  };

  const deleteTask = (id: string) => {
    // Obter o título da tarefa antes de excluí-la
    const taskToDelete = tasks.find(task => task.id === id);
    const taskTitle = taskToDelete?.title || "Desconhecida";
    
    // Limpar qualquer lembrete associado à tarefa antes de excluí-la
    clearReminderForTask(id);
    
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    
    // Notificar o usuário sobre a exclusão da tarefa
    toast({
      title: "Tarefa Excluída",
      description: `A tarefa "${taskTitle}" foi excluída permanentemente.`,
      variant: "destructive"
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <div className="sticky top-0 z-10 bg-transparent backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="text-xl font-bold">
            <span className="text-purple-500">Cyber</span> Tasks
          </div>
          <div className="flex items-center space-x-2">
            <ModeToggle />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 container max-w-3xl py-4 px-4">
        <TaskList
          tasks={tasks}
          onAddTask={addTask}
          onUpdateTask={updateTask}
          onToggleComplete={toggleTaskComplete}
          onDeleteTask={deleteTask}
        />
      </main>
      
      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
};

export default Home;
