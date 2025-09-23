/**
 * SHARED: Common Types
 * Общие типы для всех доменов
 */

// Result Pattern для error handling
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Option Pattern для nullable values  
export type Option<T> = T | null;

// Event Pattern для domain events
export interface DomainEvent {
  readonly id: string;
  readonly type: string;
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly version: number;
  readonly payload: Record<string, unknown>;
}

// Query Pattern для CQRS
export interface Query<T = unknown> {
  readonly type: string;
  readonly parameters: T;
}

export interface QueryHandler<Q extends Query, R> {
  handle(query: Q): Promise<Result<R>>;
}

// Command Pattern для CQRS  
export interface Command<T = unknown> {
  readonly type: string;
  readonly parameters: T;
  readonly timestamp: Date;
  readonly userId?: string;
}

export interface CommandHandler<C extends Command, R> {
  handle(command: C): Promise<Result<R>>;
}

// Repository Pattern
export interface Repository<T, ID> {
  findById(id: ID): Promise<Option<T>>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<Result<T>>;
  delete(id: ID): Promise<Result<void>>;
}

// Aggregate Pattern
export interface AggregateRoot {
  readonly id: string;
  readonly version: number;
  readonly events: DomainEvent[];
  
  markEventsAsCommitted(): void;
}

// Entity Pattern
export interface Entity {
  readonly id: string;
  equals(other: Entity): boolean;
}

// Value Object Pattern
export interface ValueObject<T> {
  readonly value: T;
  equals(other: ValueObject<T>): boolean;
}

// Service Pattern
export interface DomainService {
  readonly name: string;
}

// Factory Pattern
export interface Factory<T, P> {
  create(parameters: P): Result<T>;
}

// Specification Pattern  
export interface Specification<T> {
  isSatisfiedBy(entity: T): boolean;
  and(other: Specification<T>): Specification<T>;
  or(other: Specification<T>): Specification<T>;
  not(): Specification<T>;
}

// Observer Pattern для events
export interface EventObserver<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

export interface EventPublisher {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string, 
    observer: EventObserver<T>
  ): void;
}

// Utility types
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? DeepReadonlyArray<U>
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};

export interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

// Validation
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: ValidationError[];
}

export interface Validator<T> {
  validate(value: T): ValidationResult;
}