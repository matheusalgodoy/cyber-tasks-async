import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Trash, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  dueDate: string | null;
  dueTime: string | null;
  reminder: boolean;
}

interface TaskItemProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onUpdate, onToggleComplete, onDelete }: TaskItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Verificar se a tarefa está vencida
  const isOverdue = () => {
    if (!task.dueDate || task.completed) return false;
    
    const dueDate = new Date(task.dueDate);
    if (task.dueTime) {
      const [hours, minutes] = task.dueTime.split(':').map(Number);
      dueDate.setHours(hours, minutes, 0, 0);
    } else {
      dueDate.setHours(23, 59, 59, 999);
    }
    
    return dueDate < new Date();
  };
  
  // Formatar data de criação
  const formatCreatedDate = () => {
    try {
      return format(new Date(task.createdAt), "d 'de' MMMM", { locale: ptBR });
    } catch (error) {
      return "Data desconhecida";
    }
  };
  
  // Formatar data de vencimento
  const formatDueDate = () => {
    if (!task.dueDate) return null;
    
    try {
      return format(new Date(task.dueDate), "d 'de' MMMM", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };
  
  return (
    <Card 
      className={cn(
        "transition-all",
        task.completed && "opacity-70",
        isOverdue() && "border-destructive"
      )}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start gap-2">
          <Checkbox 
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task.id)}
            className="mt-1"
          />
          <div className="flex-1">
            <CardTitle className={cn(
              "text-lg font-medium",
              task.completed && "line-through text-muted-foreground"
            )}>
              {task.title}
            </CardTitle>
            
            <CardDescription className="flex items-center gap-1 mt-1 text-xs">
              <Calendar className="h-3 w-3" />
              Criada em {formatCreatedDate()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      {(task.dueDate || task.reminder) && (
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-2 mt-2">
            {task.dueDate && (
              <Badge variant={isOverdue() ? "destructive" : "outline"} className="flex items-center gap-1">
                {isOverdue() && <AlertCircle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                {formatDueDate()}
                {task.dueTime && (
                  <>
                    <Clock className="h-3 w-3 ml-1" />
                    {task.dueTime}
                  </>
                )}
              </Badge>
            )}
            
            {task.reminder && (
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-700 dark:text-purple-300">
                Lembrete ativo
              </Badge>
            )}
          </div>
        </CardContent>
      )}
      
      <CardFooter className="p-2 justify-end">
        <div className="flex gap-2">
          <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Trash className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar exclusão</DialogTitle>
              </DialogHeader>
              <p>
                Tem certeza que deseja excluir a tarefa "{task.title}"? 
                Esta ação não pode ser desfeita.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    onDelete(task.id);
                    setConfirmDelete(false);
                  }}
                >
                  Excluir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}
