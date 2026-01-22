/**
 * Admin Reviews Management Component
 * View, moderate, and analyze customer reviews
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Star, 
  Flag, 
  CheckCircle, 
  EyeOff, 
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  User,
  Car
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  getAllReviews, 
  moderateReview, 
  completeFollowup,
  getDriverRatingStats,
  getGuideRatingStats
} from '@/services/reviewService';
import type { Review, DriverRatingStats, GuideRatingStats } from '@/types/review';
import { cn } from '@/lib/utils';

export function AdminReviewsManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [driverStats, setDriverStats] = useState<DriverRatingStats[]>([]);
  const [guideStats, setGuideStats] = useState<GuideRatingStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'flagged' | 'pending'>('all');

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reviewsData, driverStatsData, guideStatsData] = await Promise.all([
        getAllReviews(
          filter === 'flagged' ? { is_flagged: true } :
          filter === 'pending' ? { status: 'pending' } :
          undefined
        ),
        getDriverRatingStats(),
        getGuideRatingStats()
      ]);
      
      setReviews(reviewsData);
      setDriverStats(driverStatsData);
      setGuideStats(guideStatsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to load reviews',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerate = async (reviewId: string, action: 'approve' | 'flag' | 'hide') => {
    try {
      await moderateReview(reviewId, action);
      toast({ title: 'Review updated' });
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to update review', variant: 'destructive' });
    }
  };

  const handleCompleteFollowup = async (reviewId: string) => {
    try {
      await completeFollowup(reviewId, 'Followed up with customer');
      toast({ title: 'Follow-up completed' });
      fetchData();
    } catch (error) {
      toast({ title: 'Failed to complete follow-up', variant: 'destructive' });
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-4 w-4',
            star <= rating 
              ? 'fill-amber-400 text-amber-400' 
              : 'fill-transparent text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );

  const getStatusBadge = (review: Review) => {
    if (review.is_flagged) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Flagged</Badge>;
    }
    switch (review.status) {
      case 'approved':
        return <Badge variant="default" className="gap-1 bg-emerald-500"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case 'hidden':
        return <Badge variant="secondary" className="gap-1"><EyeOff className="h-3 w-3" /> Hidden</Badge>;
      default:
        return <Badge variant="outline" className="gap-1">Pending</Badge>;
    }
  };

  // Calculate summary stats
  const totalReviews = reviews.length;
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length).toFixed(1)
    : '0';
  const flaggedCount = reviews.filter(r => r.is_flagged).length;
  const pendingFollowups = reviews.filter(r => r.requires_followup && !r.followup_completed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reviews & Ratings</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalReviews}</p>
                <p className="text-xs text-muted-foreground">Total reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{avgRating}</p>
                <p className="text-xs text-muted-foreground">Avg rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{flaggedCount}</p>
                <p className="text-xs text-muted-foreground">Flagged</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{pendingFollowups}</p>
                <p className="text-xs text-muted-foreground">Need follow-up</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reviews">
        <TabsList>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="drivers">Driver Stats</TabsTrigger>
          <TabsTrigger value="guides">Guide Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          {/* Filter buttons */}
          <div className="flex gap-2">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'flagged' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('flagged')}
            >
              Flagged
            </Button>
            <Button 
              variant={filter === 'pending' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Pending
            </Button>
          </div>

          {/* Reviews List */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No reviews found</div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          {renderStars(review.overall_rating)}
                          {getStatusBadge(review)}
                          {review.requires_followup && !review.followup_completed && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              Follow-up needed
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span className="capitalize">{review.service_type}</span>
                          <span>•</span>
                          <span>{new Date(review.created_at).toLocaleDateString()}</span>
                          {review.driver_id && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                Driver: {review.driver_rating || '-'}/5
                              </span>
                            </>
                          )}
                        </div>
                        
                        {review.feedback_text && (
                          <p className="text-sm mt-2">{review.feedback_text}</p>
                        )}
                        
                        {(review.positive_aspects?.length || review.improvement_areas?.length) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {review.positive_aspects?.map((aspect) => (
                              <Badge key={aspect} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                {aspect.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                            {review.improvement_areas?.map((area) => (
                              <Badge key={area} variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                {area.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {review.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModerate(review.id, 'approve')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {!review.is_flagged && review.status !== 'flagged' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModerate(review.id, 'flag')}
                          >
                            <Flag className="h-4 w-4 mr-1" />
                            Flag
                          </Button>
                        )}
                        {review.status !== 'hidden' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModerate(review.id, 'hide')}
                          >
                            <EyeOff className="h-4 w-4 mr-1" />
                            Hide
                          </Button>
                        )}
                        {review.requires_followup && !review.followup_completed && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleCompleteFollowup(review.id)}
                          >
                            Complete follow-up
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Driver Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {driverStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No driver ratings yet</p>
              ) : (
                <div className="space-y-4">
                  {driverStats.map((stat) => (
                    <div key={stat.driver_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">Driver {stat.driver_id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">{stat.total_reviews} reviews</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-bold">{stat.avg_overall}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Overall</p>
                        </div>
                        {stat.low_rating_count > 0 && (
                          <Badge variant="destructive">{stat.low_rating_count} low</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Guide Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guideStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No guide ratings yet</p>
              ) : (
                <div className="space-y-4">
                  {guideStats.map((stat) => (
                    <div key={stat.guide_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">Guide {stat.guide_id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">{stat.total_reviews} reviews</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-bold">{stat.avg_overall}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Overall</p>
                        </div>
                        {stat.low_rating_count > 0 && (
                          <Badge variant="destructive">{stat.low_rating_count} low</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
