import { useState, useCallback, memo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock } from "lucide-react";
import { Task } from "@/components/TaskItem";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface NewTaskProps {
  onAddTask: (task: Task) => void;
}

function NewTaskComponent({ onAddTask }: NewTaskProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueTime, setDueTime] = useState<string>("");
  const [reminder, setReminder] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Use funções memoizadas para evitar recriações em cada renderização
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }, []);
  
  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDueTime(e.target.value);
  }, []);
  
  const handleReminderChange = useCallback((checked: boolean) => {
    setReminder(checked);
  }, []);
  
  const handleDateSelect = useCallback((date: Date | undefined) => {
    setDueDate(date);
    if (date) {
      // Fechar o calendário após selecionar a data
      setTimeout(() => setIsCalendarOpen(false), 100);
    }
  }, []);
  
  const handleCalendarOpenChange = useCallback((open: boolean) => {
    setIsCalendarOpen(open);
  }, []);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    const newTask: Task = {
      id: uuidv4(),
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: dueDate ? dueDate.toISOString() : null,
      dueTime: dueTime || null,
      reminder: reminder && dueDate ? true : false,
    };
    
    onAddTask(newTask);
    setTitle("");
    setDueDate(undefined);
    setDueTime("");
    setReminder(false);
  }, [title, dueDate, dueTime, reminder, onAddTask]);
  
  // Calcular datas uma vez em vez de em cada renderização
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Formatar a data apenas quando necessário
  const formattedDate = dueDate ? format(dueDate, "PPP", { locale: ptBR }) : "Selecionar data";
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Adicionar nova tarefa..."
          value={title}
          onChange={handleTitleChange}
          className="flex-1"
        />
        <Button type="submit" disabled={!title.trim()}>
          Adicionar
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-4">
        {/* Seletor de data */}
        <div className="flex-1 min-w-[200px]">
          <Popover open={isCalendarOpen} onOpenChange={handleCalendarOpenChange}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formattedDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={handleDateSelect}
                initialFocus
                locale={ptBR}
                defaultMonth={today}
                fromDate={today}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Seletor de hora */}
        <div className="w-[150px]">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              value={dueTime}
              onChange={handleTimeChange}
              disabled={!dueDate}
            />
          </div>
        </div>
        
        {/* Opção de lembrete */}
        <div className="flex items-center justify-end gap-2 flex-1 min-w-[200px]">
          <Label htmlFor="reminder">Lembrete</Label>
          <Switch
            id="reminder"
            checked={reminder}
            onCheckedChange={handleReminderChange}
            disabled={!dueDate}
          />
        </div>
      </div>
    </form>
  );
}

// Memoizar o componente para evitar re-renderizações desnecessárias
export const NewTask = memo(NewTaskComponent); 