import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, Shield, Car, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';

/**
 * User Menu Component
 * قائمة المستخدم - تعمل بشكل ديناميكي مع اللغات المختلفة
 */
export const UserMenu: React.FC = () => {
  const { user, signOut, hasRole } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Button 
        asChild
        variant="outline"
        size="sm"
        className="bg-background/10 border-border/50 text-foreground hover:bg-background/20"
      >
        <Link to="/auth">
          {t('auth.signIn')}
        </Link>
      </Button>
    );
  }

  const canSwitchToDriver = hasRole('driver');
  const canSwitchToGuide = hasRole('guide');
  const hasRoleSwitchOptions = canSwitchToDriver || canSwitchToGuide;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-background/10 border-border/50 text-foreground hover:bg-background/20"
        >
          <User className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          <span className="max-w-[100px] truncate">
            {user.email?.split('@')[0] || t('common.unknown')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align={isRTL ? 'start' : 'end'} 
        className="w-56 bg-popover border-border"
      >
        <DropdownMenuItem asChild>
          <Link to="/user-dashboard" className={`w-full flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Settings className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('navbar.dashboard')}
          </Link>
        </DropdownMenuItem>

        {hasRole('admin') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin" className={`w-full flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Shield className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('admin.adminPanel')}
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {/* Role Switch Options - Only visible after authentication */}
        {hasRoleSwitchOptions && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t('roles.switchMode')}
            </DropdownMenuLabel>
            {canSwitchToDriver && (
              <DropdownMenuItem 
                onClick={() => navigate('/driver-dashboard')}
                className={isRTL ? 'flex-row-reverse' : ''}
              >
                <Car className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('roles.driverMode')}
              </DropdownMenuItem>
            )}
            {canSwitchToGuide && (
              <DropdownMenuItem 
                onClick={() => navigate('/guide-dashboard')}
                className={isRTL ? 'flex-row-reverse' : ''}
              >
                <UserCheck className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('roles.guideMode')}
              </DropdownMenuItem>
            )}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={signOut}
          className={isRTL ? 'flex-row-reverse' : ''}
        >
          <LogOut className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('auth.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
