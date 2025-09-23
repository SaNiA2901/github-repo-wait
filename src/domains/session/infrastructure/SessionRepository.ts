/**
 * DOMAIN: Session Repository Implementation
 * Type-Safe CRUD операции для сессий с валидацией
 */

import { Repository, Result } from '@/shared/types/common';
import { SessionEntity, SessionValueObjects } from '@/domains/session/types';
import { ValidationError } from '@/shared/infrastructure/ErrorHandler';
import { InputValidator } from '@/utils/validation/secureValidation';
import { secureLogger } from '@/utils/secureLogger';
import { SecureRandom } from '@/utils/secureCrypto';

export interface CreateSessionData {
  session_name: string;
  pair: string;
  timeframe: string;
  start_date: string;
  start_time: string;
  description?: string;
  tags?: string[];
}

export interface UpdateSessionData {
  session_name?: string;
  description?: string;
  tags?: string[];
  status?: string;
}

export class SessionRepository implements Repository<SessionEntity, string> {
  private sessions = new Map<string, SessionEntity>();

  async findById(id: string): Promise<SessionEntity | null> {
    try {
      const session = this.sessions.get(id);
      return session || null;
    } catch (error) {
      secureLogger.error('Failed to find session by ID', {
        sessionId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  async findAll(): Promise<SessionEntity[]> {
    try {
      return Array.from(this.sessions.values()).sort(
        (a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime()
      );
    } catch (error) {
      secureLogger.error('Failed to find all sessions', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  async findByPair(pair: string): Promise<SessionEntity[]> {
    try {
      return Array.from(this.sessions.values())
        .filter(session => session.pair.symbol === pair)
        .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());
    } catch (error) {
      secureLogger.error('Failed to find sessions by pair', {
        pair,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  async create(data: CreateSessionData): Promise<SessionEntity> {
    try {
      // Validate input data
      const validatedData = InputValidator.validateSessionData(data);
      if (!validatedData) {
        throw new ValidationError('Invalid session data', 'session_data', 'VALIDATION_FAILED');
      }

      // Check for duplicate names
      const existingSession = Array.from(this.sessions.values())
        .find(s => s.name.value === validatedData.session_name && s.pair.symbol === validatedData.pair);
      
      if (existingSession) {
        throw new ValidationError(
          'Session with this name and pair already exists',
          'session_name',
          'DUPLICATE_SESSION'
        );
      }

      // Create value objects
      const id = SessionValueObjects.sessionId(SecureRandom.uuid());
      const name = SessionValueObjects.sessionName(validatedData.session_name);
      const pair = SessionValueObjects.tradingPair(validatedData.pair);
      const timeframe = SessionValueObjects.timeFrame(validatedData.timeframe);
      const status = SessionValueObjects.sessionStatus('active');

      // Create session entity
      const session: SessionEntity = {
        id,
        name,
        pair,
        timeframe,
        status,
        startDate: new Date(`${validatedData.start_date}T${validatedData.start_time}`),
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          description: data.description,
          tags: data.tags || []
        },
        stats: {
          totalCandles: 0,
          totalPredictions: 0,
          accuratePredictions: 0,
          accuracy: 0,
          lastPrice: null,
          priceChange: 0,
          volume: 0,
          volatility: 0
        }
      };

      // Store session
      this.sessions.set(id.value, session);

      secureLogger.info('Session created successfully', {
        sessionId: id.value,
        sessionName: name.value,
        pair: pair.symbol,
        timeframe: timeframe.value
      });

      return session;
    } catch (error) {
      secureLogger.error('Failed to create session', {
        data,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async save(entity: SessionEntity): Promise<Result<SessionEntity>> {
    try {
      const updatedEntity = {
        ...entity,
        metadata: {
          ...entity.metadata,
          updatedAt: new Date()
        }
      };

      this.sessions.set(entity.id.value, updatedEntity);

      secureLogger.info('Session saved successfully', {
        sessionId: entity.id.value
      });

      return { success: true, data: updatedEntity };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      secureLogger.error('Failed to save session', {
        sessionId: entity.id.value,
        error: errorMessage
      });
      return { success: false, error: new Error(errorMessage) };
    }
  }

  async update(id: string, updates: UpdateSessionData): Promise<SessionEntity> {
    try {
      const existingSession = this.sessions.get(id);
      if (!existingSession) {
        throw new ValidationError('Session not found', 'session_id', 'SESSION_NOT_FOUND');
      }

      // Validate updates
      if (updates.session_name) {
        SessionValueObjects.sessionName(updates.session_name);
      }

      if (updates.status) {
        SessionValueObjects.sessionStatus(updates.status);
      }

      // Create updated session
      const updatedSession: SessionEntity = {
        ...existingSession,
        name: updates.session_name 
          ? SessionValueObjects.sessionName(updates.session_name)
          : existingSession.name,
        status: updates.status
          ? SessionValueObjects.sessionStatus(updates.status)
          : existingSession.status,
        metadata: {
          ...existingSession.metadata,
          updatedAt: new Date(),
          description: updates.description !== undefined 
            ? updates.description 
            : existingSession.metadata.description,
          tags: updates.tags !== undefined 
            ? updates.tags 
            : existingSession.metadata.tags
        }
      };

      this.sessions.set(id, updatedSession);

      secureLogger.info('Session updated successfully', {
        sessionId: id,
        updates: Object.keys(updates)
      });

      return updatedSession;
    } catch (error) {
      secureLogger.error('Failed to update session', {
        sessionId: id,
        updates,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      const existingSession = this.sessions.get(id);
      if (!existingSession) {
        throw new ValidationError('Session not found', 'session_id', 'SESSION_NOT_FOUND');
      }

      this.sessions.delete(id);

      secureLogger.info('Session deleted successfully', {
        sessionId: id
      });

      return { success: true, data: undefined };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      secureLogger.error('Failed to delete session', {
        sessionId: id,
        error: errorMessage
      });
      return { success: false, error: new Error(errorMessage) };
    }
  }

  async findByStatus(status: string): Promise<SessionEntity[]> {
    try {
      return Array.from(this.sessions.values())
        .filter(session => session.status.value === status)
        .sort((a, b) => b.metadata.updatedAt.getTime() - a.metadata.updatedAt.getTime());
    } catch (error) {
      secureLogger.error('Failed to find sessions by status', {
        status,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  async getSessionStats(id: string): Promise<SessionEntity['stats'] | null> {
    try {
      const session = this.sessions.get(id);
      return session?.stats || null;
    } catch (error) {
      secureLogger.error('Failed to get session stats', {
        sessionId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  async updateSessionStats(id: string, stats: Partial<SessionEntity['stats']>): Promise<void> {
    try {
      const session = this.sessions.get(id);
      if (!session) {
        throw new ValidationError('Session not found', 'session_id', 'SESSION_NOT_FOUND');
      }

      const updatedSession: SessionEntity = {
        ...session,
        stats: { ...session.stats, ...stats },
        metadata: {
          ...session.metadata,
          updatedAt: new Date()
        }
      };

      this.sessions.set(id, updatedSession);

      secureLogger.debug('Session stats updated', {
        sessionId: id,
        stats
      });
    } catch (error) {
      secureLogger.error('Failed to update session stats', {
        sessionId: id,
        stats,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Bulk operations
  async bulkCreate(sessions: CreateSessionData[]): Promise<SessionEntity[]> {
    try {
      const createdSessions: SessionEntity[] = [];
      
      for (const sessionData of sessions) {
        const session = await this.create(sessionData);
        createdSessions.push(session);
      }

      secureLogger.info('Bulk session creation completed', {
        count: createdSessions.length
      });

      return createdSessions;
    } catch (error) {
      secureLogger.error('Bulk session creation failed', {
        count: sessions.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async exportSessions(): Promise<SessionEntity[]> {
    try {
      const sessions = await this.findAll();
      
      secureLogger.info('Sessions exported', {
        count: sessions.length
      });

      return sessions;
    } catch (error) {
      secureLogger.error('Session export failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Clear all sessions (for testing/reset)
  async clear(): Promise<void> {
    try {
      this.sessions.clear();
      secureLogger.info('All sessions cleared');
    } catch (error) {
      secureLogger.error('Failed to clear sessions', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

// Singleton instance
export const sessionRepository = new SessionRepository();
