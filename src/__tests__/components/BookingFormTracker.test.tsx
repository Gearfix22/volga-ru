import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { BookingFormTracker } from '@/components/booking/BookingFormTracker';

// Mock the useDataTracking hook
const mockTrackForm = jest.fn();
jest.mock('@/hooks/useDataTracking', () => ({
  useDataTracking: () => ({
    trackForm: mockTrackForm
  })
}));

describe('BookingFormTracker', () => {
  const defaultProps = {
    serviceType: 'Transportation',
    serviceDetails: {},
    userInfo: {},
    children: <div>Test Content</div>
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should render children', () => {
    const { getByText } = render(<BookingFormTracker {...defaultProps} />);
    
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  test('should track form started on mount', () => {
    render(<BookingFormTracker {...defaultProps} />);
    
    expect(mockTrackForm).toHaveBeenCalledWith('booking', 'started', {
      serviceType: 'Transportation',
      timestamp: expect.any(String)
    });
  });

  test('should debounce service details tracking', async () => {
    const props = {
      ...defaultProps,
      serviceDetails: { pickup: 'Airport', dropoff: 'Hotel' }
    };
    
    render(<BookingFormTracker {...props} />);
    
    // Should not track immediately
    expect(mockTrackForm).toHaveBeenCalledTimes(1); // Only the 'started' event
    
    // Fast-forward time to trigger debounced call
    jest.advanceTimersByTime(500);
    
    await waitFor(() => {
      expect(mockTrackForm).toHaveBeenCalledWith(
        'booking',
        'field_changed',
        {
          serviceType: 'Transportation',
          serviceDetails: { pickup: 'Airport', dropoff: 'Hotel' },
          field: 'service_details'
        },
        'service_details'
      );
    });
  });

  test('should debounce user info tracking', async () => {
    const props = {
      ...defaultProps,
      userInfo: { 
        fullName: 'John Doe', 
        email: 'john@example.com',
        phone: '+1234567890',
        language: 'en'
      }
    };
    
    render(<BookingFormTracker {...props} />);
    
    // Fast-forward time to trigger debounced call
    jest.advanceTimersByTime(500);
    
    await waitFor(() => {
      expect(mockTrackForm).toHaveBeenCalledWith(
        'booking',
        'field_changed',
        {
          serviceType: 'Transportation',
          userInfo: {
            hasName: true,
            hasEmail: true, 
            hasPhone: true,
            language: 'en'
          },
          field: 'user_info'
        },
        'user_info'
      );
    });
  });

  test('should not track empty service details', async () => {
    render(<BookingFormTracker {...defaultProps} />);
    
    jest.advanceTimersByTime(500);
    
    // Only 'started' event should be tracked
    expect(mockTrackForm).toHaveBeenCalledTimes(1);
  });

  test('should not track empty user info', async () => {
    render(<BookingFormTracker {...defaultProps} />);
    
    jest.advanceTimersByTime(500);
    
    // Only 'started' event should be tracked
    expect(mockTrackForm).toHaveBeenCalledTimes(1);
  });
});