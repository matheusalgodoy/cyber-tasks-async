import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { TaskList } from "@/components/TaskList";
import { Task } from "@/components/TaskItem";
import { v4 as uuidv4 } from "uuid";
import { useReminders } from "@/hooks/use-reminders";
import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/components/SettingsDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NewTask } from "@/components/NewTask";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "tasks";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { clearReminderForTask } = useReminders(tasks);
  const { toast } = useToast();

  // Carregar tarefas do localStorage ao iniciar
  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error("Erro ao carregar tarefas:", error);
      }
    }
  }, []);
  
  // Salvar tarefas no localStorage quando atualizadas
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const formatDate = () => {
    const today = new Date();
    return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  };

  const addTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
    
    toast({
      title: "Tarefa Criada",
      description: `A tarefa "${task.title}" foi criada com sucesso.`
    });
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => 
      prev.map(task => task.id === updatedTask.id ? updatedTask : task)
    );
  };

  const toggleTaskComplete = (id: string) => {
    let taskTitle = "";
    let wasCompleted = false;
    
    setTasks(prev => 
      prev.map(task => {
        if (task.id === id) {
          taskTitle = task.title;
          wasCompleted = task.completed;
          return { ...task, completed: !task.completed };
        }
        return task;
      })
    );
    
    toast({
      title: wasCompleted ? "Tarefa Reaberta" : "Tarefa Concluída",
      description: `"${taskTitle}" ${wasCompleted ? "foi marcada como não concluída" : "foi concluída com sucesso"}!`
    });
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(task => task.id === id);
    
    if (!taskToDelete) return;
    
    setTasks(prev => prev.filter(task => task.id !== id));
    
    toast({
      title: "Tarefa Removida",
      description: `A tarefa "${taskToDelete.title}" foi removida.`
    });
  };

  // Filtrar tarefas não concluídas
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cyber Tasks</h1>
          <p className="text-muted-foreground">
            Tarefas pendentes: <Badge>{pendingTasks.length}</Badge>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SettingsDialog tasks={tasks} />
        </div>
      </header>
      
      <main className="space-y-6">
        <NewTask onAddTask={addTask} />
        <TaskList 
          tasks={tasks} 
          onUpdateTask={updateTask}
          onToggleComplete={toggleTaskComplete}
          onDeleteTask={deleteTask} 
        />
      </main>
    </div>
  );
}
