import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Database, Zap, Shield, Bell } from "lucide-react";

export function SettingsPage() {
  const [settings, setSettings] = useState({
    // Общие настройки
    theme: "dark",
    language: "ru",
    
    // Торговые настройки
    defaultPair: "EUR/USD",
    defaultTimeframe: "1h",
    autoSave: true,
    
    // ML настройки
    enablePredictions: true,
    predictionThreshold: 70,
    
    // Уведомления
    enableNotifications: true,
    emailNotifications: false,
    
    // Данные пользователя
    userName: "",
    email: ""
  });

  const handleSave = () => {
    try {
      localStorage.setItem('app-settings', JSON.stringify(settings));
      console.log('Настройки сохранены');
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Настройки</h1>
          <p className="text-muted-foreground">Настройка приложения и параметров торговли</p>
        </div>
      </div>

      {/* Общие настройки */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Общие настройки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Тема интерфейса</Label>
              <Select value={settings.theme} onValueChange={(value) => 
                setSettings(prev => ({ ...prev, theme: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Темная</SelectItem>
                  <SelectItem value="light">Светлая</SelectItem>
                  <SelectItem value="auto">Автоматически</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Язык интерфейса</Label>
              <Select value={settings.language} onValueChange={(value) => 
                setSettings(prev => ({ ...prev, language: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Торговые настройки */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Торговые настройки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Валютная пара по умолчанию</Label>
              <Select value={settings.defaultPair} onValueChange={(value) => 
                setSettings(prev => ({ ...prev, defaultPair: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR/USD">EUR/USD</SelectItem>
                  <SelectItem value="GBP/USD">GBP/USD</SelectItem>
                  <SelectItem value="USD/JPY">USD/JPY</SelectItem>
                  <SelectItem value="USD/CHF">USD/CHF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Таймфрейм по умолчанию</Label>
              <Select value={settings.defaultTimeframe} onValueChange={(value) => 
                setSettings(prev => ({ ...prev, defaultTimeframe: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 минута</SelectItem>
                  <SelectItem value="5m">5 минут</SelectItem>
                  <SelectItem value="15m">15 минут</SelectItem>
                  <SelectItem value="1h">1 час</SelectItem>
                  <SelectItem value="4h">4 часа</SelectItem>
                  <SelectItem value="1d">1 день</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-save"
              checked={settings.autoSave}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, autoSave: checked }))
              }
            />
            <Label htmlFor="auto-save">Автоматическое сохранение данных</Label>
          </div>
        </CardContent>
      </Card>

      {/* ML настройки */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Настройки машинного обучения
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch 
              id="enable-predictions"
              checked={settings.enablePredictions}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, enablePredictions: checked }))
              }
            />
            <Label htmlFor="enable-predictions">Включить прогнозы ИИ</Label>
          </div>

          <div className="space-y-2">
            <Label>Минимальная уверенность прогноза (%)</Label>
            <Input
              type="number"
              min="50"
              max="95"
              value={settings.predictionThreshold}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, predictionThreshold: parseInt(e.target.value) || 70 }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Прогнозы с уверенностью ниже этого значения не будут отображаться
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Уведомления */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Уведомления
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch 
              id="enable-notifications"
              checked={settings.enableNotifications}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, enableNotifications: checked }))
              }
            />
            <Label htmlFor="enable-notifications">Включить уведомления</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, emailNotifications: checked }))
              }
            />
            <Label htmlFor="email-notifications">Email уведомления</Label>
          </div>
        </CardContent>
      </Card>

      {/* Данные пользователя */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Профиль пользователя
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Имя пользователя</Label>
              <Input
                value={settings.userName}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, userName: e.target.value }))
                }
                placeholder="Введите ваше имя"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, email: e.target.value }))
                }
                placeholder="Введите ваш email"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Безопасность */}
      <Card className="trading-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Безопасность и данные
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <div className="font-medium">Экспорт данных</div>
                <div className="text-sm text-muted-foreground">Скачать все данные сессий</div>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <div className="font-medium">Очистить кэш</div>
                <div className="text-sm text-muted-foreground">Удалить временные файлы</div>
              </div>
            </Button>

            <Button variant="outline" className="h-auto p-4">
              <div className="text-center">
                <div className="font-medium">Сброс настроек</div>
                <div className="text-sm text-muted-foreground">Вернуть значения по умолчанию</div>
              </div>
            </Button>

            <Button variant="destructive" className="h-auto p-4">
              <div className="text-center">
                <div className="font-medium">Удалить все данные</div>
                <div className="text-sm text-muted-foreground">Полная очистка приложения</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Сохранение */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="trading-button-primary">
          <Settings className="h-4 w-4 mr-2" />
          Сохранить настройки
        </Button>
      </div>
    </div>
  );
}