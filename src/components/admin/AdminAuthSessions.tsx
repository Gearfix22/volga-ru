import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, RefreshCw, LogIn, LogOut, User, Shield, Car } from 'lucide-react';
import { getAuthSessionHistory, AuthSession } from '@/services/authSessionService';
import { format } from 'date-fns';

export const AdminAuthSessions: React.FC = () => {
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    const data = await getAuthSessionHistory(200);
    setSessions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter(session => 
    session.user_role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'driver': return <Car className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="flex items-center gap-1">{getRoleIcon(role)} Admin</Badge>;
      case 'driver':
        return <Badge className="bg-blue-600 flex items-center gap-1">{getRoleIcon(role)} Driver</Badge>;
      default:
        return <Badge variant="secondary" className="flex items-center gap-1">{getRoleIcon(role)} Customer</Badge>;
    }
  };

  const getEventBadge = (event: string) => {
    if (event === 'login') {
      return <Badge className="bg-green-600 flex items-center gap-1"><LogIn className="h-3 w-3" /> Login</Badge>;
    }
    return <Badge variant="outline" className="flex items-center gap-1"><LogOut className="h-3 w-3" /> Logout</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Sign-In History
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by role, event type, or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>User Agent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading sessions...
                  </TableCell>
                </TableRow>
              ) : filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No sign-in history found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(session.created_at), 'MMM dd, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>{getRoleBadge(session.user_role)}</TableCell>
                    <TableCell>{getEventBadge(session.event_type)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {session.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {session.user_agent || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AdminAuthSessions;
