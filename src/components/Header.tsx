import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./ModeToggle";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Settings } from "lucide-react";
import { useTheme } from "next-themes";

interface HeaderProps {
  currentPath: string;
}

export function Header({ currentPath }: HeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { setTheme } = useTheme();
  
  // Força o tema escuro na inicialização para garantir visibilidade no iOS
  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);
  
  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
      <div className="container flex items-center justify-between h-14 px-4 mx-auto">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-lg flex items-center gap-2">
            <span className="text-primary">Cyber</span>
            <span className="text-white">Tasks</span>
          </Link>
          
          <nav className="hidden sm:flex items-center gap-2">
            <Link to="/">
              <Button
                variant={currentPath === "/" ? "default" : "ghost"}
                className="text-sm"
              >
                Tarefas
              </Button>
            </Link>
            <Link to="/profile">
              <Button
                variant={currentPath === "/profile" ? "default" : "ghost"}
                className="text-sm"
              >
                Perfil
              </Button>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Configurações</span>
          </Button>
          
          <ModeToggle />
        </div>
      </div>
      
      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </header>
  );
}
