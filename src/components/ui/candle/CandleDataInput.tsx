import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CandlestickChart, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string;
}

interface CandleDataInputProps {
  session: any;
  onCandleAdded: (candle: CandleData) => void;
  nextCandleTime: string;
}

export function CandleDataInput({ session, onCandleAdded, nextCandleTime }: CandleDataInputProps) {
  const [formData, setFormData] = useState({
    open: "",
    high: "",
    low: "",
    close: "",
    volume: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const validateCandle = () => {
    const newErrors: Record<string, string> = {};
    const { open, high, low, close, volume } = formData;

    // Проверяем, что все поля заполнены
    if (!open) newErrors.open = "Цена открытия обязательна";
    if (!high) newErrors.high = "Максимальная цена обязательна";
    if (!low) newErrors.low = "Минимальная цена обязательна";
    if (!close) newErrors.close = "Цена закрытия обязательна";
    if (!volume) newErrors.volume = "Объем обязателен";

    const openNum = parseFloat(open);
    const highNum = parseFloat(high);
    const lowNum = parseFloat(low);
    const closeNum = parseFloat(close);
    const volumeNum = parseFloat(volume);

    // Проверяем корректность числовых значений
    if (isNaN(openNum)) newErrors.open = "Некорректное число";
    if (isNaN(highNum)) newErrors.high = "Некорректное число";
    if (isNaN(lowNum)) newErrors.low = "Некорректное число";
    if (isNaN(closeNum)) newErrors.close = "Некорректное число";
    if (isNaN(volumeNum) || volumeNum <= 0) newErrors.volume = "Объем должен быть больше 0";

    // Проверяем логику свечи
    if (!isNaN(highNum) && !isNaN(lowNum) && highNum < lowNum) {
      newErrors.high = "High не может быть меньше Low";
    }

    if (!isNaN(highNum) && !isNaN(openNum) && highNum < openNum) {
      newErrors.high = "High не может быть меньше Open";
    }

    if (!isNaN(highNum) && !isNaN(closeNum) && highNum < closeNum) {
      newErrors.high = "High не может быть меньше Close";
    }

    if (!isNaN(lowNum) && !isNaN(openNum) && lowNum > openNum) {
      newErrors.low = "Low не может быть больше Open";
    }

    if (!isNaN(lowNum) && !isNaN(closeNum) && lowNum > closeNum) {
      newErrors.low = "Low не может быть больше Close";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateCandle()) return;

    setIsSubmitting(true);
    try {
      const candleData: CandleData = {
        open: parseFloat(formData.open),
        high: parseFloat(formData.high),
        low: parseFloat(formData.low),
        close: parseFloat(formData.close),
        volume: parseFloat(formData.volume),
        timestamp: nextCandleTime
      };

      onCandleAdded(candleData);

      // Очищаем форму
      setFormData({
        open: "",
        high: "",
        low: "",
        close: "",
        volume: ""
      });
      setErrors({});

      toast({
        title: "Свеча добавлена",
        description: `Данные успешно добавлены в сессию "${session.session_name}"`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить свечу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const getCandleType = () => {
    const open = parseFloat(formData.open);
    const close = parseFloat(formData.close);
    if (isNaN(open) || isNaN(close)) return null;
    return close > open ? 'bullish' : close < open ? 'bearish' : 'doji';
  };

  const candleType = getCandleType();

  return (
    <Card className="trading-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CandlestickChart className="h-5 w-5 text-primary" />
          Ввод данных OHLCV
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Время свечи: {new Date(nextCandleTime).toLocaleString('ru-RU')}</span>
          {candleType && (
            <Badge variant={candleType === 'bullish' ? 'default' : candleType === 'bearish' ? 'destructive' : 'secondary'}>
              {candleType === 'bullish' ? 'Бычья' : candleType === 'bearish' ? 'Медвежья' : 'Доджи'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="open" className="flex items-center gap-2">
              Open (Открытие)
              {errors.open && <AlertTriangle className="h-3 w-3 text-trading-danger" />}
            </Label>
            <Input
              id="open"
              type="number"
              step="any"
              placeholder="1.0850"
              value={formData.open}
              onChange={(e) => handleInputChange('open', e.target.value)}
              className={errors.open ? 'border-trading-danger' : ''}
            />
            {errors.open && <span className="text-xs text-trading-danger">{errors.open}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="high" className="flex items-center gap-2">
              High (Максимум)
              {errors.high && <AlertTriangle className="h-3 w-3 text-trading-danger" />}
            </Label>
            <Input
              id="high"
              type="number"
              step="any"
              placeholder="1.0870"
              value={formData.high}
              onChange={(e) => handleInputChange('high', e.target.value)}
              className={errors.high ? 'border-trading-danger' : ''}
            />
            {errors.high && <span className="text-xs text-trading-danger">{errors.high}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="low" className="flex items-center gap-2">
              Low (Минимум)
              {errors.low && <AlertTriangle className="h-3 w-3 text-trading-danger" />}
            </Label>
            <Input
              id="low"
              type="number"
              step="any"
              placeholder="1.0840"
              value={formData.low}
              onChange={(e) => handleInputChange('low', e.target.value)}
              className={errors.low ? 'border-trading-danger' : ''}
            />
            {errors.low && <span className="text-xs text-trading-danger">{errors.low}</span>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="close" className="flex items-center gap-2">
              Close (Закрытие)
              {errors.close && <AlertTriangle className="h-3 w-3 text-trading-danger" />}
            </Label>
            <Input
              id="close"
              type="number"
              step="any"
              placeholder="1.0860"
              value={formData.close}
              onChange={(e) => handleInputChange('close', e.target.value)}
              className={errors.close ? 'border-trading-danger' : ''}
            />
            {errors.close && <span className="text-xs text-trading-danger">{errors.close}</span>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="volume" className="flex items-center gap-2">
            Volume (Объем)
            {errors.volume && <AlertTriangle className="h-3 w-3 text-trading-danger" />}
          </Label>
          <Input
            id="volume"
            type="number"
            step="any"
            placeholder="1000000"
            value={formData.volume}
            onChange={(e) => handleInputChange('volume', e.target.value)}
            className={errors.volume ? 'border-trading-danger' : ''}
          />
          {errors.volume && <span className="text-xs text-trading-danger">{errors.volume}</span>}
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || Object.keys(errors).length > 0}
          className="w-full"
        >
          {isSubmitting ? "Добавляем..." : "Добавить свечу"}
        </Button>
      </CardContent>
    </Card>
  );
}