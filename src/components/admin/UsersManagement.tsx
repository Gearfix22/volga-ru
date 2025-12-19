import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Search, Phone, Shield, CheckCircle, XCircle, Calendar, Edit, Trash2, UserX, RefreshCw, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, updateUserRole, disableUser, deleteUser, logAdminAction } from '@/services/adminService';

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
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit form state
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user' | 'driver'>('user');
  const [editVerified, setEditVerified] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const { data: bookings } = await supabase
        .from('bookings')
        .select('user_id, total_price');

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

  const openEditDialog = (user: UserProfile) => {
    setEditingUser(user);
    setEditFullName(user.full_name || '');
    setEditPhone(user.phone || '');
    setEditRole(user.roles.includes('admin') ? 'admin' : user.roles.includes('driver') ? 'driver' : 'user');
    setEditVerified(user.phone_verified);
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    try {
      setActionLoading(editingUser.id);
      
      // Update profile
      await updateUserProfile(editingUser.id, {
        full_name: editFullName,
        phone: editPhone,
        phone_verified: editVerified
      });

      // Update role if changed
      const currentRole = editingUser.roles.includes('admin') ? 'admin' : 
                          editingUser.roles.includes('driver') ? 'driver' : 'user';
      if (editRole !== currentRole) {
        await updateUserRole(editingUser.id, editRole);
      }

      toast({ title: 'Success', description: 'User updated successfully' });
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const confirmDeleteUser = (user: UserProfile) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDisableUser = async () => {
    if (!userToDelete) return;
    
    try {
      setActionLoading(userToDelete.id);
      await disableUser(userToDelete.id);
      
      toast({ title: 'Success', description: 'User has been disabled' });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setActionLoading(userToDelete.id);
      await deleteUser(userToDelete.id);
      
      toast({ title: 'Success', description: 'User has been permanently deleted' });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVerification = async (user: UserProfile) => {
    try {
      setActionLoading(user.id);
      await updateUserProfile(user.id, { phone_verified: !user.phone_verified });
      
      toast({ 
        title: 'Success', 
        description: `Phone ${!user.phone_verified ? 'verified' : 'unverified'} for ${user.full_name || 'user'}` 
      });
      fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
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
    if (roles.includes('driver')) {
      return <Badge variant="default" className="bg-blue-600"><Car className="h-3 w-3 mr-1" />Driver</Badge>;
    }
    return <Badge variant="secondary">Customer</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users Management
              </CardTitle>
              <CardDescription>
                View, edit, and manage registered users
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {filteredUsers.length} Users
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className={actionLoading === user.id ? 'opacity-50' : ''}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {user.full_name || 'Unnamed User'}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {user.id.slice(0, 8)}...
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleVerification(user)}
                            disabled={actionLoading === user.id}
                          >
                            {user.phone_verified ? (
                              <Badge variant="default" className="bg-green-600 cursor-pointer">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="cursor-pointer">
                                <XCircle className="h-3 w-3 mr-1" />
                                Unverified
                              </Badge>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.roles)}</TableCell>
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
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(user)}
                              disabled={actionLoading === user.id}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDeleteUser(user)}
                              disabled={actionLoading === user.id || user.roles.includes('admin')}
                              className="text-destructive hover:text-destructive"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
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

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details and permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Customer</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="verified" 
                checked={editVerified} 
                onChange={(e) => setEditVerified(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="verified">Phone Verified</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveUser} disabled={actionLoading !== null}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete/Disable User Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Choose an action for "{userToDelete?.full_name || 'this user'}":
              <ul className="mt-2 space-y-1 text-sm">
                <li><strong>Disable:</strong> User loses access but data is preserved</li>
                <li><strong>Delete:</strong> Permanently removes user and all their data</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisableUser} className="bg-yellow-600 text-white hover:bg-yellow-700">
              Disable User
            </AlertDialogAction>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
