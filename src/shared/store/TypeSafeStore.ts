import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { secureLogger } from '@/utils/secureLogger';
import { secureStorage } from '@/utils/secureStorage';

// Simplified interfaces for now
export interface SessionState {
  readonly sessions: any[];
  readonly currentSession: any | null;
  readonly loading: boolean;
  readonly error: string | null;
}

export interface CandleState {
  readonly candles: any[];
  readonly nextIndex: number;
  readonly loading: boolean;
  readonly error: string | null;
}

export interface PredictionState {
  readonly predictions: any[];
  readonly lastPrediction: any | null;
  readonly performance: any;
  readonly loading: boolean;
  readonly error: string | null;
}

export interface UIState {
  readonly activeMode: 'online' | 'manual';
  readonly activeSubsection: string;
  readonly selectedPair: string;
  readonly timeframe: string;
  readonly isConnected: boolean;
  readonly notifications: UINotification[];
}

export interface UINotification {
  readonly id: string;
  readonly type: 'success' | 'warning' | 'error' | 'info';
  readonly title: string;
  readonly message: string;
  readonly timestamp: Date;
  readonly autoHide: boolean;
}

export interface AppState {
  readonly session: SessionState;
  readonly candle: CandleState;
  readonly prediction: PredictionState;
  readonly ui: UIState;
}

export type AppAction = 
  | { type: 'SESSION_LOAD_START' }
  | { type: 'SESSION_LOAD_SUCCESS'; payload: any[] }
  | { type: 'SESSION_LOAD_ERROR'; payload: string }
  | { type: 'SESSION_SET_CURRENT'; payload: any | null }
  | { type: 'SESSION_CREATE_SUCCESS'; payload: any }
  | { type: 'SESSION_UPDATE_SUCCESS'; payload: any }
  | { type: 'SESSION_DELETE_SUCCESS'; payload: string }
  | { type: 'CANDLE_LOAD_START' }
  | { type: 'CANDLE_LOAD_SUCCESS'; payload: any[] }
  | { type: 'CANDLE_LOAD_ERROR'; payload: string }
  | { type: 'CANDLE_ADD_SUCCESS'; payload: any }
  | { type: 'CANDLE_UPDATE_SUCCESS'; payload: any }
  | { type: 'CANDLE_DELETE_SUCCESS'; payload: string }
  | { type: 'PREDICTION_LOAD_START' }
  | { type: 'PREDICTION_LOAD_SUCCESS'; payload: any[] }
  | { type: 'PREDICTION_LOAD_ERROR'; payload: string }
  | { type: 'PREDICTION_GENERATE_SUCCESS'; payload: any }
  | { type: 'PREDICTION_VALIDATE_SUCCESS'; payload: any }
  | { type: 'PREDICTION_PERFORMANCE_UPDATE'; payload: any }
  | { type: 'UI_SET_MODE'; payload: 'online' | 'manual' }
  | { type: 'UI_SET_SUBSECTION'; payload: string }
  | { type: 'UI_SET_PAIR'; payload: string }
  | { type: 'UI_SET_TIMEFRAME'; payload: string }
  | { type: 'UI_SET_CONNECTION'; payload: boolean }
  | { type: 'UI_ADD_NOTIFICATION'; payload: UINotification }
  | { type: 'UI_REMOVE_NOTIFICATION'; payload: string };

const initialState: AppState = {
  session: {
    sessions: [],
    currentSession: null,
    loading: false,
    error: null
  },
  candle: {
    candles: [],
    nextIndex: 0,
    loading: false,
    error: null
  },
  prediction: {
    predictions: [],
    lastPrediction: null,
    performance: {
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0,
      precisionUp: 0,
      precisionDown: 0,
      recallUp: 0,
      recallDown: 0,
      f1Score: 0,
      sharpeRatio: 0,
      maxDrawdown: 0
    },
    loading: false,
    error: null
  },
  ui: {
    activeMode: 'online',
    activeSubsection: '',
    selectedPair: 'EUR/USD',
    timeframe: '1h',
    isConnected: true,
    notifications: []
  }
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SESSION_LOAD_START':
      return {
        ...state,
        session: { ...state.session, loading: true, error: null }
      };

    case 'SESSION_LOAD_SUCCESS':
      return {
        ...state,
        session: { 
          ...state.session, 
          sessions: action.payload, 
          loading: false, 
          error: null 
        }
      };

    case 'SESSION_LOAD_ERROR':
      return {
        ...state,
        session: { 
          ...state.session, 
          loading: false, 
          error: action.payload 
        }
      };

    case 'SESSION_SET_CURRENT':
      return {
        ...state,
        session: { 
          ...state.session, 
          currentSession: action.payload 
        }
      };

    case 'UI_SET_MODE':
      return {
        ...state,
        ui: { ...state.ui, activeMode: action.payload, activeSubsection: '' }
      };

    case 'UI_ADD_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [action.payload, ...state.ui.notifications].slice(0, 10)
        }
      };

    case 'UI_REMOVE_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== action.payload)
        }
      };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: AppActions;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppActions {
  setActiveMode(mode: 'online' | 'manual'): void;
  setActiveSubsection(subsection: string): void;
  setSelectedPair(pair: string): void;
  setTimeframe(timeframe: string): void;
  showNotification(notification: Omit<UINotification, 'id' | 'timestamp'>): void;
  hideNotification(id: string): void;
}

export interface TypeSafeStoreProviderProps {
  children: ReactNode;
}

export function TypeSafeStoreProvider({ children }: TypeSafeStoreProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const actions: AppActions = {
    setActiveMode(mode: 'online' | 'manual') {
      dispatch({ type: 'UI_SET_MODE', payload: mode });
    },

    setActiveSubsection(subsection: string) {
      dispatch({ type: 'UI_SET_SUBSECTION', payload: subsection });
    },

    setSelectedPair(pair: string) {
      dispatch({ type: 'UI_SET_PAIR', payload: pair });
    },

    setTimeframe(timeframe: string) {
      dispatch({ type: 'UI_SET_TIMEFRAME', payload: timeframe });
    },

    showNotification(notification: Omit<UINotification, 'id' | 'timestamp'>) {
      const fullNotification: UINotification = {
        ...notification,
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };
      dispatch({ type: 'UI_ADD_NOTIFICATION', payload: fullNotification });
    },

    hideNotification(id: string) {
      dispatch({ type: 'UI_REMOVE_NOTIFICATION', payload: id });
    }
  };

  return React.createElement(AppContext.Provider, { value: { state, dispatch, actions } }, children);
}

export function useTypeSafeStore(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useTypeSafeStore must be used within TypeSafeStoreProvider');
  }
  return context;
}

export function useSessionState() {
  const { state } = useTypeSafeStore();
  return state.session;
}

export function useCandleState() {
  const { state } = useTypeSafeStore();
  return state.candle;
}

export function usePredictionState() {
  const { state } = useTypeSafeStore();
  return state.prediction;
}

export function useUIState() {
  const { state } = useTypeSafeStore();
  return state.ui;
}

export function useStoreActions() {
  const { actions } = useTypeSafeStore();
  return actions;
}