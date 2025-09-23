import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Bell, 
  Settings, 
  User, 
  Wifi, 
  WifiOff,
  TrendingUp,
  TrendingDown,
  Sun,
  Moon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModernHeaderProps {
  selectedPair: string;
  onPairChange: (pair: string) => void;
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

const currencyPairs = [
  "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", 
  "AUD/USD", "USD/CAD", "NZD/USD", "EUR/GBP",
  "EUR/JPY", "GBP/JPY", "AUD/JPY", "CAD/JPY",
  "CHF/JPY", "NZD/JPY", "EUR/CHF", "GBP/CHF",
  "BTC/USD", "ETH/USD", "LTC/USD", "XRP/USD"
];

const timeframes = [
  { value: "1m", label: "1M" },
  { value: "5m", label: "5M" },
  { value: "15m", label: "15M" },
  { value: "30m", label: "30M" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" }
];

export function ModernHeader({ 
  selectedPair, 
  onPairChange, 
  timeframe, 
  onTimeframeChange 
}: ModernHeaderProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.className = newTheme;
  };

  // Mock price data
  const currentPrice = "1.0842";
  const priceChange = "+0.0023";
  const priceChangePercent = "+0.21%";
  const isPositive = priceChange.startsWith('+');

  return (
    <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-foreground hover:bg-accent rounded-lg p-2" />
          
          {/* Market Status */}
          <div className="hidden md:flex items-center gap-3">
            <Badge 
              variant={isConnected ? "default" : "destructive"}
              className="flex items-center gap-1 px-3 py-1"
            >
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Live
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Offline
                </>
              )}
            </Badge>
            
            {/* Current Price Display */}
            <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-lg">
              <span className="text-sm font-mono text-foreground">{selectedPair}</span>
              <span className="text-lg font-mono font-bold text-foreground">{currentPrice}</span>
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-trading-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-trading-danger" />
                )}
                <span className={`text-sm font-mono ${
                  isPositive ? 'text-trading-success' : 'text-trading-danger'
                }`}>
                  {priceChange} ({priceChangePercent})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Section - Trading Controls */}
        <div className="flex items-center gap-3">
          <Select value={selectedPair} onValueChange={onPairChange}>
            <SelectTrigger className="w-32 bg-muted/50 border-border/50 text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/50 z-50">
              {currencyPairs.map(pair => (
                <SelectItem 
                  key={pair} 
                  value={pair} 
                  className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  {pair}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeframe} onValueChange={onTimeframeChange}>
            <SelectTrigger className="w-20 bg-muted/50 border-border/50 text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/50 z-50">
              {timeframes.map(tf => (
                <SelectItem 
                  key={tf.value} 
                  value={tf.value} 
                  className="text-popover-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-9 w-9 p-0 hover:bg-accent"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 hover:bg-accent relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-xs"></span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 hover:bg-accent"
              >
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border-border/50">
              <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}