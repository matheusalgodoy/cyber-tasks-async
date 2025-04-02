import { useState } from "react";
import { Trash, Edit, CheckCheck, Clock, Calendar, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt?: string; // Add creation date
  dueDate?: string; // Data de vencimento
  dueTime?: string; // Hora de vencimento
  reminder?: boolean; // Se deve mostrar lembrete
}

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const TaskItem = ({ task, onToggleComplete, onEdit, onDelete }: TaskItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Verifica se a tarefa está atrasada
  const isOverdue = () => {
    if (!task.dueDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    if (task.dueTime && dueDate.getTime() === today.getTime()) {
      const now = new Date();
      const [hours, minutes] = task.dueTime.split(':').map(Number);
      const dueDateTime = new Date();
      dueDateTime.setHours(hours, minutes, 0, 0);
      return now > dueDateTime;
    }
    
    return today > dueDate;
  };

  // Formata a data em formato legível
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "d 'de' MMMM", { locale: ptBR });
  };

  const overdueStatus = !task.completed && task.dueDate && isOverdue();

  return (
    <div 
      className={cn(
        "cyber-box my-3 transition-all duration-300",
        task.completed && "opacity-70",
        overdueStatus && "border-destructive"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleComplete(task.id)}
          className={cn(
            "mt-1 h-5 w-5 flex-shrink-0 flex items-center justify-center rounded border",
            task.completed 
              ? "bg-accent/20 border-accent/50 text-accent" 
              : "bg-secondary border-border text-transparent hover:border-border/80"
          )}
        >
          {task.completed && <CheckCheck size={14} className="animate-pulse-glow" />}
        </button>
        
        <div className="flex-1">
          <h3 
            className={cn(
              "text-lg font-medium cursor-pointer",
              task.completed && "line-through text-muted-foreground",
              !task.completed && "text-foreground hover:text-primary",
              overdueStatus && "text-destructive"
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {task.title}
          </h3>
          
          {task.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {task.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
            {task.createdAt && (
              <div className="flex items-center text-muted-foreground">
                <Clock size={12} className="mr-1" />
                Criado em {task.createdAt}
              </div>
            )}
            
            {task.dueDate && (
              <div 
                className={cn(
                  "flex items-center",
                  overdueStatus ? "text-destructive" : "text-muted-foreground"
                )}
              >
                <Calendar size={12} className="mr-1" />
                Vence em {formatDate(task.dueDate)}
                {task.dueTime && <> às {task.dueTime}</>}
              </div>
            )}
            
            {task.reminder && (
              <div className="flex items-center text-accent">
                <Bell size={12} className="mr-1" />
                Lembrete ativado
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => onEdit(task)} 
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Edit task"
          >
            <Edit size={18} />
          </button>
          <button 
            onClick={() => onDelete(task.id)} 
            className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Delete task"
          >
            <Trash size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
