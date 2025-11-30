import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Search, Phone, Shield, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string;
  phone_verified: boolean;
  created_at: string;
  roles: string[];
  bookings_count: number;
  total_spent: number;
}

export const UsersManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch bookings stats per user
      const { data: bookings } = await supabase
        .from('bookings')
        .select('user_id, total_price');

      // Create maps
      const rolesMap: Record<string, string[]> = {};
      roles?.forEach(r => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role);
      });

      const bookingsMap: Record<string, { count: number; total: number }> = {};
      bookings?.forEach(b => {
        if (!b.user_id) return;
        if (!bookingsMap[b.user_id]) bookingsMap[b.user_id] = { count: 0, total: 0 };
        bookingsMap[b.user_id].count += 1;
        bookingsMap[b.user_id].total += b.total_price || 0;
      });

      // Combine data
      const enrichedUsers: UserProfile[] = (profiles || []).map(profile => ({
        ...profile,
        roles: rolesMap[profile.id] || ['user'],
        bookings_count: bookingsMap[profile.id]?.count || 0,
        total_spent: bookingsMap[profile.id]?.total || 0,
      }));

      setUsers(enrichedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery) ||
    user.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes('admin')) {
      return <Badge variant="destructive"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
    }
    if (roles.includes('moderator')) {
      return <Badge variant="default"><Shield className="h-3 w-3 mr-1" />Moderator</Badge>;
    }
    return <Badge variant="secondary">Customer</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users Management
            </CardTitle>
            <CardDescription>
              View all registered users with contact details
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2 self-start">
            {filteredUsers.length} Users
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading users...</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {user.full_name || 'Unnamed User'}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono font-semibold text-primary">
                            {user.phone || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.phone_verified ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.roles)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.bookings_count}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${user.total_spent?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
