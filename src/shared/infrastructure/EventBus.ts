/**
 * INFRASTRUCTURE: Event Bus Implementation
 * Type-Safe Event System для межмодульной коммуникации
 */

import { DomainEvent, EventObserver, EventPublisher } from '@/shared/types/common';
import { secureLogger } from '@/utils/secureLogger';

type EventType = string;
type EventHandler<T extends DomainEvent> = (event: T) => Promise<void> | void;

export class TypeSafeEventBus implements EventPublisher {
  private handlers = new Map<EventType, Set<EventHandler<any>>>();
  private eventHistory: DomainEvent[] = [];
  private maxHistorySize = 1000;

  // Subscribe to events with type safety
  subscribe<T extends DomainEvent>(
    eventType: EventType,
    observer: EventObserver<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    
    this.handlers.get(eventType)!.add(observer.handle.bind(observer));
    
    secureLogger.info('Event subscription registered', {
      eventType,
      handlerCount: this.handlers.get(eventType)!.size
    });
  }

  // Publish events with automatic error handling
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    try {
      // Store in history
      this.addToHistory(event);
      
      const handlers = this.handlers.get(event.type);
      if (!handlers || handlers.size === 0) {
        secureLogger.debug('No handlers for event', { eventType: event.type });
        return;
      }

      // Execute all handlers in parallel
      const promises = Array.from(handlers).map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          secureLogger.error('Event handler failed', {
            eventType: event.type,
            eventId: event.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          // Don't let one handler failure affect others
        }
      });

      await Promise.allSettled(promises);
      
      secureLogger.debug('Event published successfully', {
        eventType: event.type,
        eventId: event.id,
        handlerCount: handlers.size
      });
      
    } catch (error) {
      secureLogger.error('Event publishing failed', {
        eventType: event.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Unsubscribe from events
  unsubscribe<T extends DomainEvent>(
    eventType: EventType,
    observer: EventObserver<T>
  ): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(observer.handle.bind(observer));
      
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
      
      secureLogger.info('Event subscription removed', {
        eventType,
        remainingHandlers: handlers.size
      });
    }
  }

  // Get event history for debugging
  getEventHistory(limit?: number): DomainEvent[] {
    return limit 
      ? this.eventHistory.slice(-limit)
      : [...this.eventHistory];
  }

  // Clear event history
  clearHistory(): void {
    this.eventHistory = [];
    secureLogger.info('Event history cleared');
  }

  // Get active subscriptions info
  getSubscriptions(): Record<EventType, number> {
    const subscriptions: Record<EventType, number> = {};
    
    for (const [eventType, handlers] of this.handlers.entries()) {
      subscriptions[eventType] = handlers.size;
    }
    
    return subscriptions;
  }

  private addToHistory(event: DomainEvent): void {
    this.eventHistory.push(event);
    
    // Maintain max history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }
}

// Singleton instance
export const eventBus = new TypeSafeEventBus();

// Domain Events
export interface SessionCreatedEvent extends DomainEvent {
  type: 'session.created';
  payload: {
    sessionId: string;
    sessionName: string;
    pair: string;
    timeframe: string;
  };
}

export interface SessionLoadedEvent extends DomainEvent {
  type: 'session.loaded';
  payload: {
    sessionId: string;
    candleCount: number;
  };
}

export interface CandleAddedEvent extends DomainEvent {
  type: 'candle.added';
  payload: {
    sessionId: string;
    candleIndex: number;
    price: number;
  };
}

export interface PredictionGeneratedEvent extends DomainEvent {
  type: 'prediction.generated';
  payload: {
    sessionId: string;
    candleIndex: number;
    direction: 'UP' | 'DOWN';
    probability: number;
    confidence: number;
  };
}

export interface PredictionValidatedEvent extends DomainEvent {
  type: 'prediction.validated';
  payload: {
    predictionId: string;
    correct: boolean;
    actualPrice: number;
    targetPrice: number;
  };
}

// Event Factory
export class EventFactory {
  private static eventCounter = 0;

  static sessionCreated(
    sessionId: string,
    sessionName: string,
    pair: string,
    timeframe: string
  ): SessionCreatedEvent {
    return {
      id: this.generateEventId(),
      type: 'session.created',
      timestamp: new Date(),
      aggregateId: sessionId,
      version: 1,
      payload: { sessionId, sessionName, pair, timeframe }
    };
  }

  static sessionLoaded(
    sessionId: string,
    candleCount: number
  ): SessionLoadedEvent {
    return {
      id: this.generateEventId(),
      type: 'session.loaded',
      timestamp: new Date(),
      aggregateId: sessionId,
      version: 1,
      payload: { sessionId, candleCount }
    };
  }

  static candleAdded(
    sessionId: string,
    candleIndex: number,
    price: number
  ): CandleAddedEvent {
    return {
      id: this.generateEventId(),
      type: 'candle.added',
      timestamp: new Date(),
      aggregateId: sessionId,
      version: 1,
      payload: { sessionId, candleIndex, price }
    };
  }

  static predictionGenerated(
    sessionId: string,
    candleIndex: number,
    direction: 'UP' | 'DOWN',
    probability: number,
    confidence: number
  ): PredictionGeneratedEvent {
    return {
      id: this.generateEventId(),
      type: 'prediction.generated',
      timestamp: new Date(),
      aggregateId: sessionId,
      version: 1,
      payload: { sessionId, candleIndex, direction, probability, confidence }
    };
  }

  static predictionValidated(
    predictionId: string,
    correct: boolean,
    actualPrice: number,
    targetPrice: number
  ): PredictionValidatedEvent {
    return {
      id: this.generateEventId(),
      type: 'prediction.validated',
      timestamp: new Date(),
      aggregateId: predictionId,
      version: 1,
      payload: { predictionId, correct, actualPrice, targetPrice }
    };
  }

  private static generateEventId(): string {
    return `event-${Date.now()}-${++this.eventCounter}`;
  }
}