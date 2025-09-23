import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { TypeSafeStoreProvider } from '@/shared/store/TypeSafeStore';
import { TradingStoreProvider } from '@/store/TradingStore';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import PerformanceMonitor from '@/components/ui/common/PerformanceMonitor';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 2,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TypeSafeStoreProvider>
            <TradingStoreProvider>
              <TooltipProvider>
                <Toaster />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
                <PerformanceMonitor isVisible={import.meta.env.DEV} />
              </TooltipProvider>
            </TradingStoreProvider>
          </TypeSafeStoreProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
