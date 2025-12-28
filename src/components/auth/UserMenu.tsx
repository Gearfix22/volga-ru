import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, Shield, Car, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const UserMenu: React.FC = () => {
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Button 
        asChild
        variant="outline"
        size="sm"
        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <Link to="/auth">
          Sign In
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
        <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
          <User className="h-4 w-4 mr-2" />
          {user.email?.split('@')[0]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link to="/user-dashboard" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </DropdownMenuItem>

        {hasRole('admin') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin" className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {/* Role Switch Options - Only visible after authentication */}
        {hasRoleSwitchOptions && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Switch Mode
            </DropdownMenuLabel>
            {canSwitchToDriver && (
              <DropdownMenuItem onClick={() => navigate('/driver-dashboard')}>
                <Car className="h-4 w-4 mr-2" />
                Driver Mode
              </DropdownMenuItem>
            )}
            {canSwitchToGuide && (
              <DropdownMenuItem onClick={() => navigate('/guide-dashboard')}>
                <UserCheck className="h-4 w-4 mr-2" />
                Guide Mode
              </DropdownMenuItem>
            )}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
