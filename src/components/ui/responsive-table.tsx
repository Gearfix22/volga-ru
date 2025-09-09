import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Column {
  key: string;
  label: string;
  className?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  data: any[];
  columns: Column[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  actions?: (row: any) => React.ReactNode;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  data,
  columns,
  loading,
  emptyState,
  actions
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        {emptyState || <p className="text-muted-foreground">No data available</p>}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-left text-sm font-medium ${column.className || ''}`}
                  >
                    {column.label}
                  </th>
                ))}
                {actions && <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={row.id || index} className="border-b hover:bg-muted/50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 text-sm ${column.className || ''}`}
                    >
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((row, index) => (
          <Card key={row.id || index}>
            <CardContent className="p-4">
              <div className="space-y-3">
                {columns.map((column) => (
                  <div key={column.key} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      {column.label}:
                    </span>
                    <div className="text-sm font-medium">
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </div>
                  </div>
                ))}
                {actions && (
                  <div className="pt-2 border-t flex justify-end">
                    {actions(row)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};