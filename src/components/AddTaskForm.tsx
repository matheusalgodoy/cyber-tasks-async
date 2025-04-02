import { useState, useEffect } from "react";
import { X, Plus, Check, Calendar, Clock, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "./TaskItem";

interface AddTaskFormProps {
  onAddTask: (task: Omit<Task, "id">) => void;
  onUpdateTask: (task: Task) => void;
  initialTask?: Task;
  onCancel?: () => void;
}

const AddTaskForm = ({ 
  onAddTask, 
  onUpdateTask, 
  initialTask, 
  onCancel 
}: AddTaskFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [reminder, setReminder] = useState(false);
  const [error, setError] = useState("");
  const isEditing = !!initialTask;

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || "");
      setDueDate(initialTask.dueDate || "");
      setDueTime(initialTask.dueTime || "");
      setReminder(initialTask.reminder || false);
    }
  }, [initialTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("O título da tarefa é obrigatório");
      return;
    }
    
    // Validar a data se fornecida
    if (dueDate) {
      // Obter data atual no formato YYYY-MM-DD
      const today = new Date();
      const todayStr = getTodayFormatted();
      
      // Comparar apenas as datas (desconsiderando horas)
      if (dueDate < todayStr) {
        setError("A data não pode estar no passado");
        return;
      }
    }
    
    const taskData = {
      title: title.trim(),
      description: description.trim(),
      completed: initialTask?.completed || false,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      reminder: reminder
    };
    
    if (isEditing && initialTask) {
      onUpdateTask({
        ...initialTask,
        ...taskData
      });
    } else {
      onAddTask(taskData);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setDueTime("");
    setReminder(false);
    setError("");
    if (onCancel) onCancel();
  };

  // Obter a data mínima (hoje) para o input de data
  const getTodayFormatted = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <form onSubmit={handleSubmit} className="cyber-box mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-foreground">
          {isEditing ? "EDITAR TAREFA" : "NOVA TAREFA"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-destructive/20 rounded-full text-muted-foreground hover:text-destructive"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
            Título
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError("");
            }}
            placeholder="Título da tarefa"
            className={cn(
              "cyber-input w-full px-3 py-2",
              error && "border-destructive"
            )}
          />
          {error && <p className="mt-1 text-destructive text-sm">{error}</p>}
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
            Descrição
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição da tarefa (opcional)"
            rows={3}
            className="cyber-input w-full px-3 py-2"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-foreground mb-1">
              <Calendar size={14} className="inline mr-1" />
              Data de vencimento
            </label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              min={getTodayFormatted()}
              onChange={(e) => {
                setDueDate(e.target.value);
                if (error) setError("");
              }}
              className="cyber-input w-full px-3 py-2"
            />
          </div>
          
          <div>
            <label htmlFor="dueTime" className="block text-sm font-medium text-foreground mb-1">
              <Clock size={14} className="inline mr-1" />
              Horário
            </label>
            <input
              id="dueTime"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="cyber-input w-full px-3 py-2"
              disabled={!dueDate}
            />
          </div>
        </div>
        
        <div className="bg-accent/10 p-3 rounded-md border border-accent/20 mb-2">
          <div className="flex items-center">
            <input
              id="reminder"
              type="checkbox"
              checked={reminder}
              onChange={(e) => setReminder(e.target.checked)}
              className="h-5 w-5 rounded border-accent text-primary focus:ring-primary"
              disabled={!dueDate}
            />
            <label htmlFor="reminder" className="ml-2 text-sm font-medium text-foreground flex items-center">
              <Bell size={16} className="mr-1 text-accent" />
              Ativar lembrete
            </label>
          </div>
          
          {!dueDate && (
            <p className="text-xs text-muted-foreground mt-2 ml-7">
              Para ativar lembretes, defina uma data de vencimento
            </p>
          )}
          
          {dueDate && (
            <p className="text-xs text-accent/80 mt-2 ml-7">
              Você receberá um lembrete antes do prazo conforme suas configurações
            </p>
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80 border border-border"
          >
            Cancelar
          </button>
          
          <button type="submit" className={cn("cyber-btn", isEditing ? "cyber-btn-green" : "cyber-btn-blue")}>
            <span className="mr-1">
              {isEditing ? <Check size={16} /> : <Plus size={16} />}
            </span>
            {isEditing ? "Atualizar" : "Adicionar"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddTaskForm;
