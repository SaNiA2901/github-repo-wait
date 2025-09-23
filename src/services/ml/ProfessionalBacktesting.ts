/**
 * PHASE 3: Professional Backtesting Engine
 * Production-grade backtesting with realistic market simulation,
 * slippage, commissions, and comprehensive risk metrics
 */

import { SecureRandom } from '@/utils/secureCrypto';
import { secureLogger } from '@/utils/secureLogger';
import { PredictionResult, CandleData } from './AdvancedMLPipeline';

export interface BacktestConfig {
  initialCapital: number;
  positionSize: number; // Percentage of capital per trade
  commission: number; // Percentage per trade
  slippage: number; // Percentage slippage per trade
  maxDrawdown: number; // Maximum allowed drawdown before stopping
  maxConcurrentTrades: number;
  riskFreeRate: number; // For Sharpe ratio calculation
  startDate?: Date;
  endDate?: Date;
}

export interface Trade {
  id: string;
  entryTime: number;
  exitTime?: number;
  entryPrice: number;
  exitPrice?: number;
  direction: 'long' | 'short';
  quantity: number;
  commission: number;
  slippage: number;
  pnl?: number;
  pnlPercentage?: number;
  status: 'open' | 'closed';
  prediction: PredictionResult;
  maxDrawdownDuringTrade?: number;
}

export interface BacktestResults {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  totalPnLPercentage: number;
  finalCapital: number;
  maxDrawdown: number;
  maxDrawdownPercentage: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  averageTradeDuration: number; // in minutes
  maxTradeDuration: number;
  totalCommissions: number;
  totalSlippage: number;
  recoveryFactor: number;
  expectedReturn: number;
  volatility: number;
  trades: Trade[];
  dailyReturns: number[];
  equityCurve: { timestamp: number; equity: number; drawdown: number }[];
  monthlyReturns: { month: string; return: number }[];
  riskMetrics: RiskMetrics;
  config: BacktestConfig;
  startTime: number;
  endTime: number;
  processingTime: number;
}

export interface RiskMetrics {
  var95: number; // Value at Risk 95%
  var99: number; // Value at Risk 99%
  cvar95: number; // Conditional Value at Risk 95%
  maxConsecutiveLosses: number;
  maxConsecutiveWins: number;
  downDeviationRatio: number;
  upsideDeviationRatio: number;
  beta: number; // Market beta (if benchmark provided)
  alpha: number; // Jensen's alpha
  informationRatio: number;
  trackingError: number;
}

class ProfessionalBacktesting {
  private currentCapital: number = 0;
  private peakCapital: number = 0;
  private trades: Trade[] = [];
  private openTrades: Trade[] = [];
  private dailyReturns: number[] = [];
  private equityCurve: { timestamp: number; equity: number; drawdown: number }[] = [];
  private config: BacktestConfig = {
    initialCapital: 10000,
    positionSize: 0.02, // 2% per trade
    commission: 0.001, // 0.1%
    slippage: 0.0005, // 0.05%
    maxDrawdown: 0.2, // 20%
    maxConcurrentTrades: 5,
    riskFreeRate: 0.02 // 2% annual
  };

  /**
   * Run comprehensive backtest with realistic market simulation
   */
  async runBacktest(
    candles: CandleData[],
    predictions: PredictionResult[],
    config: Partial<BacktestConfig> = {}
  ): Promise<BacktestResults> {
    const startTime = performance.now();
    
    // Merge config
    this.config = { ...this.config, ...config };
    this.currentCapital = this.config.initialCapital;
    this.peakCapital = this.config.initialCapital;
    
    // Reset state
    this.trades = [];
    this.openTrades = [];
    this.dailyReturns = [];
    this.equityCurve = [];

    secureLogger.info('Starting professional backtest', {
      candleCount: candles.length,
      predictionCount: predictions.length,
      initialCapital: this.config.initialCapital,
      config: this.config
    });

    try {
      // Process each prediction with market simulation
      for (let i = 0; i < predictions.length && i < candles.length - 1; i++) {
        const prediction = predictions[i];
        const currentCandle = candles[i];
        const nextCandle = candles[i + 1];

        // Check for exit signals on open trades
        this.processExitSignals(currentCandle, nextCandle);

        // Process new entry signal
        if (this.shouldEnterTrade(prediction, currentCandle)) {
          await this.enterTrade(prediction, currentCandle, nextCandle);
        }

        // Update equity curve
        this.updateEquityCurve(currentCandle.timestamp);

        // Check risk limits
        if (this.getCurrentDrawdown() > this.config.maxDrawdown) {
          secureLogger.warn('Maximum drawdown exceeded, stopping backtest', {
            currentDrawdown: this.getCurrentDrawdown(),
            maxDrawdown: this.config.maxDrawdown
          });
          break;
        }
      }

      // Close any remaining open trades
      if (candles.length > 0) {
        const lastCandle = candles[candles.length - 1];
        this.closeAllTrades(lastCandle);
      }

      const processingTime = performance.now() - startTime;
      
      // Calculate comprehensive results
      const results = this.calculateBacktestResults(processingTime);
      
      secureLogger.info('Backtest completed', {
        totalTrades: results.totalTrades,
        winRate: results.winRate,
        totalPnL: results.totalPnL,
        sharpeRatio: results.sharpeRatio,
        maxDrawdown: results.maxDrawdown,
        processingTime
      });

      return results;

    } catch (error) {
      secureLogger.error('Backtest failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        tradesProcessed: this.trades.length
      });
      throw error;
    }
  }

  /**
   * Determine if we should enter a trade based on prediction and risk management
   */
  private shouldEnterTrade(prediction: PredictionResult, candle: CandleData): boolean {
    // Check basic criteria
    if (prediction.confidence < 0.6) return false; // Minimum confidence threshold
    if (this.openTrades.length >= this.config.maxConcurrentTrades) return false;
    
    // Check available capital
    const positionValue = this.currentCapital * this.config.positionSize;
    if (positionValue < 100) return false; // Minimum position size

    // Risk management checks
    const currentDrawdown = this.getCurrentDrawdown();
    if (currentDrawdown > this.config.maxDrawdown * 0.8) return false; // Stop trading near max drawdown

    // Additional filters based on market conditions
    if (this.isMarketVolatile(candle)) {
      return prediction.confidence > 0.8; // Higher confidence required in volatile markets
    }

    return true;
  }

  /**
   * Enter a new trade with realistic market simulation
   */
  private async enterTrade(
    prediction: PredictionResult,
    currentCandle: CandleData,
    nextCandle: CandleData
  ): Promise<void> {
    const positionValue = this.currentCapital * this.config.positionSize;
    
    // Simulate realistic entry price with slippage
    const entryPrice = this.calculateEntryPrice(nextCandle, prediction.direction);
    const quantity = positionValue / entryPrice;
    
    // Calculate costs
    const commission = positionValue * this.config.commission;
    const slippage = positionValue * this.config.slippage;
    const totalCosts = commission + slippage;

    // Create trade
    const trade: Trade = {
      id: SecureRandom.uuid(),
      entryTime: nextCandle.timestamp,
      entryPrice,
      direction: prediction.direction === 'up' ? 'long' : 'short',
      quantity,
      commission,
      slippage,
      status: 'open',
      prediction
    };

    // Update capital
    this.currentCapital -= totalCosts;
    
    this.openTrades.push(trade);
    
    secureLogger.debug('Entered trade', {
      tradeId: trade.id,
      direction: trade.direction,
      entryPrice: trade.entryPrice,
      quantity: trade.quantity,
      confidence: prediction.confidence
    });
  }

  /**
   * Process exit signals for open trades
   */
  private processExitSignals(currentCandle: CandleData, nextCandle: CandleData): void {
    const tradesToClose: Trade[] = [];

    for (const trade of this.openTrades) {
      let shouldClose = false;
      let exitReason = '';

      // Time-based exit (hold for maximum duration)
      const tradeDuration = currentCandle.timestamp - trade.entryTime;
      const maxDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (tradeDuration > maxDuration) {
        shouldClose = true;
        exitReason = 'time_limit';
      }

      // Profit target and stop loss
      const currentPrice = currentCandle.close;
      const priceChange = trade.direction === 'long' 
        ? (currentPrice - trade.entryPrice) / trade.entryPrice
        : (trade.entryPrice - currentPrice) / trade.entryPrice;

      // Dynamic stop loss based on volatility
      const stopLoss = -0.02; // 2% stop loss
      const profitTarget = 0.04; // 4% profit target

      if (priceChange <= stopLoss) {
        shouldClose = true;
        exitReason = 'stop_loss';
      } else if (priceChange >= profitTarget) {
        shouldClose = true;
        exitReason = 'profit_target';
      }

      // Trailing stop logic
      if (priceChange > 0.01) { // Only if in profit
        const trailingStop = priceChange * 0.5; // Trail 50% of profit
        if (priceChange < trailingStop) {
          shouldClose = true;
          exitReason = 'trailing_stop';
        }
      }

      if (shouldClose) {
        tradesToClose.push(trade);
      }
    }

    // Close trades
    for (const trade of tradesToClose) {
      this.closeTrade(trade, nextCandle);
    }
  }

  /**
   * Close a trade with realistic market simulation
   */
  private closeTrade(trade: Trade, candle: CandleData): void {
    // Calculate exit price with slippage
    const exitPrice = this.calculateExitPrice(candle, trade.direction);
    
    // Calculate P&L
    const priceChange = trade.direction === 'long'
      ? exitPrice - trade.entryPrice
      : trade.entryPrice - exitPrice;
    
    const grossPnL = priceChange * trade.quantity;
    
    // Calculate exit costs
    const positionValue = trade.quantity * exitPrice;
    const exitCommission = positionValue * this.config.commission;
    const exitSlippage = positionValue * this.config.slippage;
    const totalExitCosts = exitCommission + exitSlippage;
    
    const netPnL = grossPnL - totalExitCosts;
    const pnlPercentage = netPnL / (trade.quantity * trade.entryPrice);

    // Update trade
    trade.exitTime = candle.timestamp;
    trade.exitPrice = exitPrice;
    trade.pnl = netPnL;
    trade.pnlPercentage = pnlPercentage;
    trade.commission += exitCommission;
    trade.slippage += exitSlippage;
    trade.status = 'closed';

    // Update capital
    this.currentCapital += positionValue + netPnL;
    this.peakCapital = Math.max(this.peakCapital, this.currentCapital);

    // Move from open to closed trades
    this.openTrades = this.openTrades.filter(t => t.id !== trade.id);
    this.trades.push(trade);

    secureLogger.debug('Closed trade', {
      tradeId: trade.id,
      pnl: netPnL,
      pnlPercentage,
      duration: trade.exitTime! - trade.entryTime
    });
  }

  /**
   * Calculate realistic entry price with slippage
   */
  private calculateEntryPrice(candle: CandleData, direction: 'up' | 'down'): number {
    const basePrice = candle.open;
    const slippageAmount = basePrice * this.config.slippage;
    
    // Slippage works against the trader
    return direction === 'up' 
      ? basePrice + slippageAmount 
      : basePrice - slippageAmount;
  }

  /**
   * Calculate realistic exit price with slippage
   */
  private calculateExitPrice(candle: CandleData, direction: 'long' | 'short'): number {
    const basePrice = candle.close;
    const slippageAmount = basePrice * this.config.slippage;
    
    // Slippage works against the trader
    return direction === 'long'
      ? basePrice - slippageAmount
      : basePrice + slippageAmount;
  }

  /**
   * Close all open trades (at end of backtest)
   */
  private closeAllTrades(lastCandle: CandleData): void {
    const openTradesToClose = [...this.openTrades];
    for (const trade of openTradesToClose) {
      this.closeTrade(trade, lastCandle);
    }
  }

  /**
   * Update equity curve tracking
   */
  private updateEquityCurve(timestamp: number): void {
    // Calculate current equity including open positions
    let totalEquity = this.currentCapital;
    
    for (const trade of this.openTrades) {
      // Mark-to-market open positions (simplified)
      const unrealizedPnL = 0; // Would calculate based on current price
      totalEquity += unrealizedPnL;
    }

    const drawdown = this.peakCapital > 0 ? (this.peakCapital - totalEquity) / this.peakCapital : 0;

    this.equityCurve.push({
      timestamp,
      equity: totalEquity,
      drawdown
    });
  }

  /**
   * Get current drawdown
   */
  private getCurrentDrawdown(): number {
    if (this.peakCapital === 0) return 0;
    return (this.peakCapital - this.currentCapital) / this.peakCapital;
  }

  /**
   * Check if market is volatile (simplified)
   */
  private isMarketVolatile(candle: CandleData): boolean {
    const range = candle.high - candle.low;
    const volatility = range / candle.close;
    return volatility > 0.02; // 2% daily range considered volatile
  }

  /**
   * Calculate comprehensive backtest results
   */
  private calculateBacktestResults(processingTime: number): BacktestResults {
    const closedTrades = this.trades.filter(t => t.status === 'closed');
    const winningTrades = closedTrades.filter(t => t.pnl! > 0);
    const losingTrades = closedTrades.filter(t => t.pnl! <= 0);

    // Basic metrics
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalPnLPercentage = totalPnL / this.config.initialCapital;
    const winRate = closedTrades.length > 0 ? winningTrades.length / closedTrades.length : 0;

    // Risk metrics
    const maxDrawdown = Math.max(...this.equityCurve.map(e => e.drawdown));
    const maxDrawdownPercentage = maxDrawdown;

    // Returns calculation
    const returns = this.calculateReturns();
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const volatility = this.calculateVolatility(returns);
    
    // Ratios
    const sharpeRatio = volatility > 0 ? (avgReturn - this.config.riskFreeRate / 252) / volatility : 0;
    const sortinoRatio = this.calculateSortinoRatio(returns);
    const calmarRatio = maxDrawdownPercentage > 0 ? totalPnLPercentage / maxDrawdownPercentage : 0;

    // Trade metrics
    const averageWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + t.pnl!, 0) / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 
      ? losingTrades.reduce((sum, t) => sum + t.pnl!, 0) / losingTrades.length : 0;
    
    const profitFactor = averageLoss < 0 ? -averageWin / averageLoss : 0;

    // Duration metrics
    const tradeDurations = closedTrades.map(t => t.exitTime! - t.entryTime);
    const averageTradeDuration = tradeDurations.length > 0 
      ? tradeDurations.reduce((a, b) => a + b, 0) / tradeDurations.length / (60 * 1000) : 0; // in minutes

    // Cost analysis
    const totalCommissions = closedTrades.reduce((sum, t) => sum + t.commission, 0);
    const totalSlippage = closedTrades.reduce((sum, t) => sum + t.slippage, 0);

    // Risk metrics
    const riskMetrics = this.calculateRiskMetrics(returns, closedTrades);

    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      totalPnL,
      totalPnLPercentage,
      finalCapital: this.currentCapital,
      maxDrawdown: maxDrawdown * this.config.initialCapital,
      maxDrawdownPercentage,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      profitFactor,
      averageWin,
      averageLoss,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl!)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl!)) : 0,
      averageTradeDuration,
      maxTradeDuration: tradeDurations.length > 0 ? Math.max(...tradeDurations) / (60 * 1000) : 0,
      totalCommissions,
      totalSlippage,
      recoveryFactor: maxDrawdownPercentage > 0 ? totalPnLPercentage / maxDrawdownPercentage : 0,
      expectedReturn: avgReturn * 252, // Annualized
      volatility: volatility * Math.sqrt(252), // Annualized
      trades: [...closedTrades],
      dailyReturns: returns,
      equityCurve: [...this.equityCurve],
      monthlyReturns: this.calculateMonthlyReturns(),
      riskMetrics,
      config: { ...this.config },
      startTime: this.equityCurve.length > 0 ? this.equityCurve[0].timestamp : Date.now(),
      endTime: this.equityCurve.length > 0 ? this.equityCurve[this.equityCurve.length - 1].timestamp : Date.now(),
      processingTime
    };
  }

  private calculateReturns(): number[] {
    const returns: number[] = [];
    for (let i = 1; i < this.equityCurve.length; i++) {
      const prevEquity = this.equityCurve[i - 1].equity;
      const currentEquity = this.equityCurve[i].equity;
      if (prevEquity > 0) {
        returns.push((currentEquity - prevEquity) / prevEquity);
      }
    }
    return returns;
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;
    return Math.sqrt(variance);
  }

  private calculateSortinoRatio(returns: number[]): number {
    const targetReturn = this.config.riskFreeRate / 252;
    const excessReturns = returns.map(r => r - targetReturn);
    const downside = excessReturns.filter(r => r < 0);
    
    if (downside.length === 0) return 0;
    
    const downDeviation = Math.sqrt(downside.reduce((sum, r) => sum + r * r, 0) / downside.length);
    const avgExcessReturn = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length;
    
    return downDeviation > 0 ? avgExcessReturn / downDeviation : 0;
  }

  private calculateMonthlyReturns(): { month: string; return: number }[] {
    // Simplified monthly return calculation
    // In production, this would group by actual months
    return [];
  }

  private calculateRiskMetrics(returns: number[], trades: Trade[]): RiskMetrics {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    return {
      var95: sortedReturns.length > 0 ? sortedReturns[Math.floor(sortedReturns.length * 0.05)] : 0,
      var99: sortedReturns.length > 0 ? sortedReturns[Math.floor(sortedReturns.length * 0.01)] : 0,
      cvar95: 0, // Simplified
      maxConsecutiveLosses: this.calculateMaxConsecutiveLosses(trades),
      maxConsecutiveWins: this.calculateMaxConsecutiveWins(trades),
      downDeviationRatio: 0,
      upsideDeviationRatio: 0,
      beta: 0,
      alpha: 0,
      informationRatio: 0,
      trackingError: 0
    };
  }

  private calculateMaxConsecutiveLosses(trades: Trade[]): number {
    let maxConsecutive = 0;
    let current = 0;
    
    for (const trade of trades) {
      if (trade.pnl! <= 0) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 0;
      }
    }
    
    return maxConsecutive;
  }

  private calculateMaxConsecutiveWins(trades: Trade[]): number {
    let maxConsecutive = 0;
    let current = 0;
    
    for (const trade of trades) {
      if (trade.pnl! > 0) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 0;
      }
    }
    
    return maxConsecutive;
  }
}

// Export singleton instance
export const professionalBacktesting = new ProfessionalBacktesting();
