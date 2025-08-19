import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserActivityHistory, ActivityHistoryItem } from '@/services/userActivityService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  CreditCard, 
  User, 
  LogIn, 
  LogOut, 
  UserPlus,
  CalendarPlus,
  CalendarCheck,
  Eye,
  FileText,
  Search,
  Activity,
  Clock
} from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

const iconMap = {
  'calendar': Calendar,
  'calendar-plus': CalendarPlus,
  'calendar-check': CalendarCheck,
  'credit-card': CreditCard,
  'user': User,
  'log-in': LogIn,
  'log-out': LogOut,
  'user-plus': UserPlus,
  'eye': Eye,
  'file-text': FileText,
  'search': Search,
  'activity': Activity
};

export const UserActivityHistory: React.FC = () => {
  const { t } = useLanguage();

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['user-activity-history'],
    queryFn: () => getUserActivityHistory(50),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const getActivityTypeColor = (type: string, activityType?: string): string => {
    if (type === 'booking') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (type === 'activity') {
      if (activityType?.includes('payment')) return 'bg-green-100 text-green-800 border-green-200';
      if (activityType?.includes('login') || activityType?.includes('signup')) return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (type === 'form_interaction') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (type === 'search') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatActivityTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    
    if (isToday(date)) {
      return `Today at ${format(date, 'HH:mm')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, yyyy HH:mm');
    }
  };

  const getTimeAgo = (timestamp: string): string => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const ActivityIcon: React.FC<{ iconName: string; className?: string }> = ({ iconName, className = "h-4 w-4" }) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Activity;
    return <IconComponent className={className} />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">Error loading activity history</p>
            <p className="text-sm text-gray-500 mt-1">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity History
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your recent activities and interactions
        </p>
      </CardHeader>
      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No activity history yet</p>
            <p className="text-sm text-gray-400 mt-1">Your activities will appear here as you use the platform</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={`${activity.type}-${activity.id}`}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <ActivityIcon iconName={activity.icon} className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getActivityTypeColor(activity.type, activity.data?.activity_type)}`}
                        >
                          {activity.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatActivityTime(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">
                        {getTimeAgo(activity.timestamp)}
                      </p>
                      {activity.data?.total_price && (
                        <p className="text-sm font-medium text-green-600">
                          ${activity.data.total_price}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};