import { supabase } from '@/integrations/supabase/client';

export interface UserActivity {
  id: string;
  activity_type: string;
  activity_data: any;
  activity_description: string;
  created_at: string;
  session_id?: string;
  metadata?: any;
}

export interface ActivityHistoryItem {
  id: string;
  type: 'activity' | 'booking' | 'page_visit' | 'form_interaction' | 'search';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  data?: any;
}

// Get comprehensive user activity history from multiple sources
export const getUserActivityHistory = async (limit = 50): Promise<ActivityHistoryItem[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Fetch from user_activities table
    const { data: activities } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch recent bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch recent page visits
    const { data: pageVisits } = await supabase
      .from('page_visits')
      .select('*')
      .eq('user_id', user.id)
      .order('visit_timestamp', { ascending: false })
      .limit(15);

    // Fetch form interactions
    const { data: formInteractions } = await supabase
      .from('form_interactions')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(10);

    // Fetch search queries
    const { data: searchQueries } = await supabase
      .from('search_queries')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(10);

    // Convert all activities to unified format
    const unifiedHistory: ActivityHistoryItem[] = [];

    // Add user activities
    activities?.forEach(activity => {
      unifiedHistory.push({
        id: activity.id,
        type: 'activity',
        title: getActivityTitle(activity.activity_type),
        description: activity.activity_description || `${activity.activity_type} activity`,
        timestamp: activity.created_at,
        icon: getActivityIcon(activity.activity_type),
        data: activity.activity_data
      });
    });

    // Add bookings
    bookings?.forEach(booking => {
      unifiedHistory.push({
        id: booking.id,
        type: 'booking',
        title: `${booking.service_type} Booking`,
        description: `Created booking for ${booking.service_type} - $${booking.total_price}`,
        timestamp: booking.created_at,
        icon: 'calendar',
        data: {
          service_type: booking.service_type,
          total_price: booking.total_price,
          status: booking.status
        }
      });
    });

    // Add page visits (only significant pages)
    pageVisits?.forEach(visit => {
      if (isSignificantPageVisit(visit.page_url)) {
        unifiedHistory.push({
          id: visit.id,
          type: 'page_visit',
          title: 'Page Visit',
          description: `Visited ${getPageTitle(visit.page_url)}`,
          timestamp: visit.visit_timestamp,
          icon: 'eye',
          data: { page_url: visit.page_url, page_title: visit.page_title }
        });
      }
    });

    // Add form interactions (only significant ones)
    formInteractions?.forEach(interaction => {
      if (interaction.interaction_type === 'submitted') {
        unifiedHistory.push({
          id: interaction.id,
          type: 'form_interaction',
          title: 'Form Submission',
          description: `Submitted ${interaction.form_type} form`,
          timestamp: interaction.timestamp,
          icon: 'file-text',
          data: { form_type: interaction.form_type }
        });
      }
    });

    // Add search queries
    searchQueries?.forEach(query => {
      unifiedHistory.push({
        id: query.id,
        type: 'search',
        title: 'Search Query',
        description: `Searched for "${query.query_text}"`,
        timestamp: query.timestamp,
        icon: 'search',
        data: { query_text: query.query_text, search_type: query.search_type }
      });
    });

    // Sort by timestamp and limit
    return unifiedHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

  } catch (error) {
    console.error('Error fetching user activity history:', error);
    return [];
  }
};

// Enhanced activity tracking to log more user actions
export const trackUserAction = async (action: string, details?: any) => {
  await logUserActivity(
    action,
    details || {},
    getActionDescription(action, details)
  );
};

// Log a generic user activity
export const logUserActivity = async (
  activityType: string,
  activityData: any,
  description?: string,
  sessionId?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        activity_type: activityType,
        activity_data: activityData,
        activity_description: description,
        session_id: sessionId
      });

    if (error) {
      console.error('Error logging user activity:', error);
    }
  } catch (error) {
    console.error('Error in logUserActivity:', error);
  }
};

// Helper functions
const getActivityTitle = (activityType: string): string => {
  const titles: Record<string, string> = {
    'booking_created': 'Booking Created',
    'booking_status_changed': 'Booking Updated',
    'payment_completed': 'Payment Completed',
    'profile_updated': 'Profile Updated',
    'login': 'Logged In',
    'logout': 'Logged Out',
    'signup': 'Account Created'
  };
  return titles[activityType] || activityType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getActivityIcon = (activityType: string): string => {
  const icons: Record<string, string> = {
    'booking_created': 'calendar-plus',
    'booking_status_changed': 'calendar-check',
    'payment_completed': 'credit-card',
    'profile_updated': 'user',
    'login': 'log-in',
    'logout': 'log-out',
    'signup': 'user-plus'
  };
  return icons[activityType] || 'activity';
};

const isSignificantPageVisit = (pageUrl: string): boolean => {
  const significantPages = ['/services', '/booking', '/contact', '/about', '/dashboard'];
  return significantPages.some(page => pageUrl.includes(page));
};

const getPageTitle = (pageUrl: string): string => {
  const pageTitles: Record<string, string> = {
    '/services': 'Services Page',
    '/booking': 'Booking Page',
    '/contact': 'Contact Page',
    '/about': 'About Page',
    '/dashboard': 'Dashboard',
    '/payment': 'Payment Page'
  };
  
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pageUrl.includes(path)) return title;
  }
  
  return pageUrl;
};

const getActionDescription = (action: string, details?: any): string => {
  const descriptions: Record<string, string> = {
    'login': 'Logged into the platform',
    'logout': 'Logged out of the platform',
    'profile_updated': 'Updated profile information',
    'language_changed': `Changed language to ${details?.language || 'unknown'}`,
    'payment_initiated': `Initiated payment for ${details?.service_type || 'service'}`,
    'payment_completed': `Completed payment of $${details?.amount || '0'}`,
    'service_viewed': `Viewed ${details?.service_type || 'service'} details`,
    'contact_form_submitted': 'Submitted contact form',
    'newsletter_subscribed': 'Subscribed to newsletter'
  };
  return descriptions[action] || `Performed action: ${action}`;
};