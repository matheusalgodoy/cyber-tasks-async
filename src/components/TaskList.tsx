import { useState } from "react";
import TaskItem, { Task } from "./TaskItem";
import AddTaskForm from "./AddTaskForm";
import { useToast } from "@/hooks/use-toast";
import { Plus, CircleDot, CheckCircle } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id">) => void;
  onUpdateTask: (task: Task) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

const TaskList = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onToggleComplete,
  onDeleteTask
}: TaskListProps) => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();
  
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    onDeleteTask(id);
    toast({
      title: "Tarefa excluída",
      description: "Sua tarefa foi excluída com sucesso",
      variant: "destructive"
    });
  };

  const handleUpdateTask = (task: Task) => {
    onUpdateTask(task);
    setEditingTask(null);
    setShowAddForm(false);
    toast({
      title: "Tarefa atualizada",
      description: "Sua tarefa foi atualizada com sucesso"
    });
  };

  const handleAddTask = (task: Omit<Task, "id">) => {
    onAddTask(task);
    setShowAddForm(false);
    toast({
      title: "Tarefa adicionada",
      description: "Sua nova tarefa foi adicionada com sucesso"
    });
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  
  return (
    <div>
      {!showAddForm ? (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold uppercase text-foreground border-b-2 border-primary pb-1">
              TAREFAS
            </h2>
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded inline-flex items-center gap-2 font-medium"
            >
              <Plus size={18} />
              Nova Tarefa
            </button>
          </div>
          
          <div className="space-y-6">
            {tasks.length === 0 ? (
              <div className="cyber-box text-center py-8">
                <p className="text-muted-foreground">Nenhuma tarefa ainda. Adicione uma para começar!</p>
              </div>
            ) : (
              <>
                {pendingTasks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CircleDot size={16} className="text-foreground" />
                      <h2 className="text-md font-bold uppercase text-foreground">PENDENTES ({pendingTasks.length})</h2>
                    </div>
                    {pendingTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleComplete={onToggleComplete}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
                
                {completedTasks.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CircleDot size={16} className="text-accent" />
                      <h2 className="text-md font-bold uppercase text-foreground">CONCLUÍDAS ({completedTasks.length})</h2>
                    </div>
                    {completedTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleComplete={onToggleComplete}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <AddTaskForm 
          onAddTask={handleAddTask} 
          onUpdateTask={handleUpdateTask}
          initialTask={editingTask || undefined}
          onCancel={() => {
            setEditingTask(null);
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
};

export default TaskList;
