
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { ServiceDetails, UserInfo, BookingData } from '@/types/booking';

interface BookingState {
  serviceType: string;
  serviceDetails: ServiceDetails;
  userInfo: UserInfo;
  currentStep: number;
  isSubmitting: boolean;
  totalPrice: number;
}

type BookingAction =
  | { type: 'SET_SERVICE_TYPE'; payload: string }
  | { type: 'UPDATE_SERVICE_DETAILS'; payload: Partial<ServiceDetails> }
  | { type: 'UPDATE_USER_INFO'; payload: Partial<UserInfo> }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_TOTAL_PRICE'; payload: number }
  | { type: 'RESET_BOOKING' };

const initialState: BookingState = {
  serviceType: '',
  serviceDetails: {},
  userInfo: {
    fullName: '',
    email: '',
    phone: '',
    language: 'english'
  },
  currentStep: 1,
  isSubmitting: false,
  totalPrice: 0
};

const bookingReducer = (state: BookingState, action: BookingAction): BookingState => {
  switch (action.type) {
    case 'SET_SERVICE_TYPE':
      return { ...state, serviceType: action.payload };
    case 'UPDATE_SERVICE_DETAILS':
      return { 
        ...state, 
        serviceDetails: { ...state.serviceDetails, ...action.payload } 
      };
    case 'UPDATE_USER_INFO':
      return { 
        ...state, 
        userInfo: { ...state.userInfo, ...action.payload } 
      };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'SET_TOTAL_PRICE':
      return { ...state, totalPrice: action.payload };
    case 'RESET_BOOKING':
      return initialState;
    default:
      return state;
  }
};

interface BookingContextType {
  state: BookingState;
  setServiceType: (serviceType: string) => void;
  updateServiceDetails: (details: Partial<ServiceDetails>) => void;
  updateUserInfo: (info: Partial<UserInfo>) => void;
  setCurrentStep: (step: number) => void;
  setSubmitting: (submitting: boolean) => void;
  setTotalPrice: (price: number) => void;
  resetBooking: () => void;
  getBookingData: () => BookingData;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const setServiceType = (serviceType: string) => {
    dispatch({ type: 'SET_SERVICE_TYPE', payload: serviceType });
  };

  const updateServiceDetails = (details: Partial<ServiceDetails>) => {
    dispatch({ type: 'UPDATE_SERVICE_DETAILS', payload: details });
  };

  const updateUserInfo = (info: Partial<UserInfo>) => {
    dispatch({ type: 'UPDATE_USER_INFO', payload: info });
  };

  const setCurrentStep = (step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  const setSubmitting = (submitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', payload: submitting });
  };

  const setTotalPrice = (price: number) => {
    dispatch({ type: 'SET_TOTAL_PRICE', payload: price });
  };

  const resetBooking = () => {
    dispatch({ type: 'RESET_BOOKING' });
  };

  const getBookingData = (): BookingData => ({
    serviceType: state.serviceType,
    serviceDetails: state.serviceDetails,
    userInfo: state.userInfo,
    totalPrice: state.totalPrice
  });

  const value: BookingContextType = {
    state,
    setServiceType,
    updateServiceDetails,
    updateUserInfo,
    setCurrentStep,
    setSubmitting,
    setTotalPrice,
    resetBooking,
    getBookingData
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
