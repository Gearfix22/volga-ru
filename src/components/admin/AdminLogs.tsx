import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, FileText, Users, Settings } from 'lucide-react';
import { getAdminLogs } from '@/services/adminService';
import { getAuthSessionHistory, AuthSession } from '@/services/authSessionService';
import { format } from 'date-fns';
import AdminAuthSessions from './AdminAuthSessions';
import AdminCurrencySettings from './AdminCurrencySettings';

interface AdminLog {
  id: string;
  admin_id: string;
  action_type: string;
  target_id: string | null;
  target_table: string | null;
  payload: any;
  created_at: string;
}

export const AdminLogs = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('actions');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getAdminLogs(100);
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.target_table?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.target_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionBadge = (actionType: string) => {
    const colors: Record<string, string> = {
      confirm_booking: 'bg-green-100 text-green-800',
      reject_booking: 'bg-red-100 text-red-800',
      update_payment: 'bg-blue-100 text-blue-800',
      update_booking: 'bg-yellow-100 text-yellow-800',
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Actions
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Sign-ins
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Currency
          </TabsTrigger>
        </TabsList>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Admin Activity Logs
                  </CardTitle>
                  <CardDescription>
                    Track all administrative actions ({filteredLogs.length} entries)
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No admin logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionBadge(log.action_type)}>
                              {log.action_type.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.target_table && (
                              <span className="text-sm text-muted-foreground">
                                {log.target_table}: {log.target_id?.slice(0, 8)}...
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.payload ? JSON.stringify(log.payload).slice(0, 50) + '...' : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <AdminAuthSessions />
        </TabsContent>

        <TabsContent value="currency">
          <AdminCurrencySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLogs;
