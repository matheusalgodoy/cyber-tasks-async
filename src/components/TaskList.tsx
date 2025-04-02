import { useState, useEffect } from "react";
import { Task, TaskItem } from "@/components/TaskItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export function TaskList({
  tasks,
  onUpdateTask,
  onToggleComplete,
  onDeleteTask
}: TaskListProps) {
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(tasks);
  
  // Aplicar filtragem de tarefas
  useEffect(() => {
    let result = [...tasks];
    
    // Aplicar filtro de pesquisa
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(task => 
        task.title.toLowerCase().includes(term)
      );
    }
    
    // Aplicar filtro de status
    if (filter === "active") {
      result = result.filter(task => !task.completed);
    } else if (filter === "completed") {
      result = result.filter(task => task.completed);
    }
    
    // Ordenar por data
    result.sort((a, b) => {
      // Tarefas com prazo aparecem primeiro
      const aHasDue = Boolean(a.dueDate);
      const bHasDue = Boolean(b.dueDate);
      
      if (aHasDue && !bHasDue) return -1;
      if (!aHasDue && bHasDue) return 1;
      
      // Ordenar por data de vencimento
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      // Por fim, ordenar por data de criação (mais recentes primeiro)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    setFilteredTasks(result);
  }, [tasks, filter, searchTerm]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      <Tabs defaultValue="all" onValueChange={setFilter}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="active">Pendentes</TabsTrigger>
          <TabsTrigger value="completed">Concluídas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          {renderTaskList(filteredTasks)}
        </TabsContent>
        
        <TabsContent value="active" className="mt-4">
          {renderTaskList(filteredTasks)}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          {renderTaskList(filteredTasks)}
        </TabsContent>
      </Tabs>
    </div>
  );
  
  function renderTaskList(tasks: Task[]) {
    if (tasks.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm 
            ? "Nenhuma tarefa corresponde à sua pesquisa"
            : filter === "completed"
              ? "Nenhuma tarefa concluída ainda"
              : filter === "active"
                ? "Nenhuma tarefa pendente"
                : "Nenhuma tarefa adicionada ainda"}
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onUpdate={onUpdateTask}
            onToggleComplete={onToggleComplete}
            onDelete={onDeleteTask}
          />
        ))}
      </div>
    );
  }
}
