import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ModernSidebar } from "./ModernSidebar";
import { ModernHeader } from "./ModernHeader";

interface ModernLayoutProps {
  children: ReactNode;
  selectedPair: string;
  onPairChange: (pair: string) => void;
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

export function ModernLayout({ 
  children, 
  selectedPair, 
  onPairChange, 
  timeframe, 
  onTimeframeChange 
}: ModernLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen w-full bg-gradient-background flex">
        <ModernSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <ModernHeader
            selectedPair={selectedPair}
            onPairChange={onPairChange}
            timeframe={timeframe}
            onTimeframeChange={onTimeframeChange}
          />
          
          <main className="flex-1 overflow-auto bg-background">
            <div className="container mx-auto p-6 space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}