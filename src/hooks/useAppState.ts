/**
 * Unified Application State Management
 * Replaces multiple state management hooks with a single, optimized solution
 */

import { useReducer, useCallback, useEffect, useMemo } from 'react';
import { TradingSession, CandleData } from '@/types/session';
import { logger } from '@/utils/logger';
import { errorHandler, ErrorCategory } from '@/utils/errorHandler';

// State types
interface AppState {
  // Session management
  sessions: TradingSession[];
  currentSession: TradingSession | null;
  isSessionLoading: boolean;
  sessionError: string | null;

  // Candle data
  candles: CandleData[];
  isCandlesLoading: boolean;
  candlesError: string | null;

  // Predictions
  predictions: Record<string, any>;
  isPredicting: boolean;
  predictionError: string | null;

  // UI state
  activeTab: string;
  isOffline: boolean;
  lastSyncTime: number | null;
}

// Action types
type AppAction = 
  | { type: 'SET_SESSIONS'; payload: TradingSession[] }
  | { type: 'SET_CURRENT_SESSION'; payload: TradingSession | null }
  | { type: 'SET_SESSION_LOADING'; payload: boolean }
  | { type: 'SET_SESSION_ERROR'; payload: string | null }
  | { type: 'ADD_SESSION'; payload: TradingSession }
  | { type: 'UPDATE_SESSION'; payload: { id: string; updates: Partial<TradingSession> } }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'SET_CANDLES'; payload: CandleData[] }
  | { type: 'SET_CANDLES_LOADING'; payload: boolean }
  | { type: 'SET_CANDLES_ERROR'; payload: string | null }
  | { type: 'ADD_CANDLE'; payload: CandleData }
  | { type: 'UPDATE_CANDLE'; payload: { index: number; updates: Partial<CandleData> } }
  | { type: 'DELETE_CANDLE'; payload: number }
  | { type: 'SET_PREDICTIONS'; payload: Record<string, any> }
  | { type: 'SET_PREDICTING'; payload: boolean }
  | { type: 'SET_PREDICTION_ERROR'; payload: string | null }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'SET_OFFLINE'; payload: boolean }
  | { type: 'UPDATE_SYNC_TIME'; payload: number }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  sessions: [],
  currentSession: null,
  isSessionLoading: false,
  sessionError: null,
  candles: [],
  isCandlesLoading: false,
  candlesError: null,
  predictions: {},
  isPredicting: false,
  predictionError: null,
  activeTab: 'overview',
  isOffline: false,
  lastSyncTime: null,
};

// Reducer with immutable updates
function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };
    
    case 'SET_SESSION_LOADING':
      return { ...state, isSessionLoading: action.payload };
    
    case 'SET_SESSION_ERROR':
      return { ...state, sessionError: action.payload };
    
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] };
    
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.id
            ? { ...session, ...action.payload.updates }
            : session
        ),
        currentSession: state.currentSession?.id === action.payload.id
          ? { ...state.currentSession, ...action.payload.updates }
          : state.currentSession
      };
    
    case 'DELETE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(session => session.id !== action.payload),
        currentSession: state.currentSession?.id === action.payload ? null : state.currentSession
      };
    
    case 'SET_CANDLES':
      return { ...state, candles: action.payload };
    
    case 'SET_CANDLES_LOADING':
      return { ...state, isCandlesLoading: action.payload };
    
    case 'SET_CANDLES_ERROR':
      return { ...state, candlesError: action.payload };
    
    case 'ADD_CANDLE':
      return { ...state, candles: [...state.candles, action.payload] };
    
    case 'UPDATE_CANDLE':
      return {
        ...state,
        candles: state.candles.map(candle =>
          candle.candle_index === action.payload.index
            ? { ...candle, ...action.payload.updates }
            : candle
        )
      };
    
    case 'DELETE_CANDLE':
      return {
        ...state,
        candles: state.candles.filter(candle => candle.candle_index !== action.payload)
      };
    
    case 'SET_PREDICTIONS':
      return { ...state, predictions: action.payload };
    
    case 'SET_PREDICTING':
      return { ...state, isPredicting: action.payload };
    
    case 'SET_PREDICTION_ERROR':
      return { ...state, predictionError: action.payload };
    
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    
    case 'SET_OFFLINE':
      return { ...state, isOffline: action.payload };
    
    case 'UPDATE_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Persistence helper
const persistState = (state: AppState) => {
  try {
    const persistedData = {
      sessions: state.sessions,
      currentSession: state.currentSession,
      candles: state.candles,
      lastSyncTime: state.lastSyncTime,
    };
    localStorage.setItem('app_state', JSON.stringify(persistedData));
  } catch (error) {
    logger.warn('Failed to persist state', { error });
  }
};

const loadPersistedState = (): Partial<AppState> => {
  try {
    const persistedData = localStorage.getItem('app_state');
    return persistedData ? JSON.parse(persistedData) : {};
  } catch (error) {
    logger.warn('Failed to load persisted state', { error });
    return {};
  }
};

/**
 * Unified Application State Hook
 * Replaces useNewApplicationState, useStateManager, and other state management hooks
 */
export const useAppState = () => {
  const [state, dispatch] = useReducer(appStateReducer, {
    ...initialState,
    ...loadPersistedState(),
  });

  // Persist state changes
  useEffect(() => {
    persistState(state);
  }, [state]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_OFFLINE', payload: false });
    const handleOffline = () => dispatch({ type: 'SET_OFFLINE', payload: true });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Session management actions
  const sessionActions = useMemo(() => ({
    setSessions: useCallback((sessions: TradingSession[]) => {
      dispatch({ type: 'SET_SESSIONS', payload: sessions });
    }, []),

    setCurrentSession: useCallback((session: TradingSession | null) => {
      dispatch({ type: 'SET_CURRENT_SESSION', payload: session });
      logger.info('Current session changed', { sessionId: session?.id });
    }, []),

    addSession: useCallback((session: TradingSession) => {
      dispatch({ type: 'ADD_SESSION', payload: session });
      logger.info('Session added', { sessionId: session.id });
    }, []),

    updateSession: useCallback((id: string, updates: Partial<TradingSession>) => {
      dispatch({ type: 'UPDATE_SESSION', payload: { id, updates } });
      logger.info('Session updated', { sessionId: id, updates });
    }, []),

    deleteSession: useCallback((id: string) => {
      dispatch({ type: 'DELETE_SESSION', payload: id });
      logger.info('Session deleted', { sessionId: id });
    }, []),

    setSessionLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_SESSION_LOADING', payload: loading });
    }, []),

    setSessionError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_SESSION_ERROR', payload: error });
      if (error) {
        errorHandler.handleError(new Error(error), ErrorCategory.BUSINESS_LOGIC, { context: 'session' });
      }
    }, []),
  }), []);

  // Candle management actions
  const candleActions = useMemo(() => ({
    setCandles: useCallback((candles: CandleData[]) => {
      dispatch({ type: 'SET_CANDLES', payload: candles });
    }, []),

    addCandle: useCallback((candle: CandleData) => {
      dispatch({ type: 'ADD_CANDLE', payload: candle });
      logger.info('Candle added', { candleIndex: candle.candle_index });
    }, []),

    updateCandle: useCallback((index: number, updates: Partial<CandleData>) => {
      dispatch({ type: 'UPDATE_CANDLE', payload: { index, updates } });
      logger.debug('Candle updated', { candleIndex: index, updates });
    }, []),

    deleteCandle: useCallback((index: number) => {
      dispatch({ type: 'DELETE_CANDLE', payload: index });
      logger.info('Candle deleted', { candleIndex: index });
    }, []),

    setCandlesLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_CANDLES_LOADING', payload: loading });
    }, []),

    setCandlesError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_CANDLES_ERROR', payload: error });
      if (error) {
        errorHandler.handleError(new Error(error), ErrorCategory.DATA_PROCESSING, { context: 'candles' });
      }
    }, []),
  }), []);

  // Prediction management actions
  const predictionActions = useMemo(() => ({
    setPredictions: useCallback((predictions: Record<string, any>) => {
      dispatch({ type: 'SET_PREDICTIONS', payload: predictions });
    }, []),

    setPredicting: useCallback((predicting: boolean) => {
      dispatch({ type: 'SET_PREDICTING', payload: predicting });
    }, []),

    setPredictionError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_PREDICTION_ERROR', payload: error });
      if (error) {
        errorHandler.handleError(new Error(error), ErrorCategory.ML_PREDICTION, { context: 'predictions' });
      }
    }, []),
  }), []);

  // UI management actions
  const uiActions = useMemo(() => ({
    setActiveTab: useCallback((tab: string) => {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    }, []),

    updateSyncTime: useCallback(() => {
      dispatch({ type: 'UPDATE_SYNC_TIME', payload: Date.now() });
    }, []),
  }), []);

  // Utility functions
  const utilities = useMemo(() => ({
    resetState: useCallback(() => {
      dispatch({ type: 'RESET_STATE' });
      logger.info('Application state reset');
    }, []),

    getSessionById: useCallback((sessionId: string) => {
      return state.sessions.find(session => session.id === sessionId) || null;
    }, [state.sessions]),

    getCurrentSessionCandles: useCallback(() => {
      return state.currentSession
        ? state.candles.filter(candle => candle.session_id === state.currentSession!.id)
        : [];
    }, [state.candles, state.currentSession]),

    getAppStatistics: useCallback(() => {
      const currentSessionCandles = state.currentSession
        ? state.candles.filter(c => c.session_id === state.currentSession!.id)
        : [];

      return {
        totalSessions: state.sessions.length,
        totalCandles: state.candles.length,
        currentSessionCandles: currentSessionCandles.length,
        predictionsCount: state.candles.filter(c => c.prediction_direction).length,
        lastActivity: state.currentSession?.updated_at || null,
        syncStatus: state.isOffline ? 'offline' : 'online',
        lastSyncTime: state.lastSyncTime,
      };
    }, [state]),
  }), [state]);

  return {
    // State
    state,
    
    // Actions
    ...sessionActions,
    ...candleActions,
    ...predictionActions,
    ...uiActions,
    
    // Utilities
    ...utilities,
  };
};