import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService, TimeEntry } from '../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Calendar, Clock, Edit, Check, X } from 'lucide-react';
import { toast } from '../hooks/use-toast';

export const Timesheet: React.FC = () => {
  const { user } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ checkIn: '', checkOut: '' });

  useEffect(() => {
    if (user) {
      loadTimeEntries();
    }
  }, [user]);

  const loadTimeEntries = () => {
    if (!user) return;
    const entries = authService.getTimeEntries(user.id);
    // Sort by date (newest first)
    const sortedEntries = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTimeEntries(sortedEntries);
  };

  const startEdit = (entry: TimeEntry) => {
    setEditingEntry(entry.id);
    setEditForm({
      checkIn: entry.checkIn,
      checkOut: entry.checkOut || ''
    });
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setEditForm({ checkIn: '', checkOut: '' });
  };

  const saveEdit = (entryId: string) => {
    if (!editForm.checkIn) {
      toast({
        title: "Error",
        description: "Check-in time is required",
        variant: "destructive",
      });
      return;
    }

    try {
      let totalHours = 0;
      if (editForm.checkOut) {
        const checkInDate = new Date(`2000-01-01T${editForm.checkIn}`);
        const checkOutDate = new Date(`2000-01-01T${editForm.checkOut}`);
        totalHours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
      }

      authService.updateTimeEntry(entryId, {
        checkIn: editForm.checkIn,
        checkOut: editForm.checkOut || null,
        totalHours: Math.round(totalHours * 100) / 100
      });

      loadTimeEntries();
      setEditingEntry(null);
      setEditForm({ checkIn: '', checkOut: '' });

      toast({
        title: "Success",
        description: "Time entry updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update time entry",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getWeeklyTotal = (entries: TimeEntry[], weekOffset: number = 0) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() - (weekOffset * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startOfWeek && entryDate <= endOfWeek;
    });

    return weekEntries.reduce((total, entry) => total + entry.totalHours, 0);
  };

  const currentWeekTotal = getWeeklyTotal(timeEntries, 0);
  const lastWeekTotal = getWeeklyTotal(timeEntries, 1);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Timesheet</h1>
        <p className="text-muted-foreground">View and manage your time entries</p>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-foreground">{currentWeekTotal.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted-foreground/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Week</p>
                <p className="text-2xl font-bold text-foreground">{lastWeekTotal.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Recent Time Entries</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No time entries found</p>
              <p className="text-sm text-muted-foreground">Start tracking your time from the dashboard</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{formatDate(entry.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {editingEntry === entry.id ? (
                    <div className="flex items-center space-x-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Check In</Label>
                        <Input
                          type="time"
                          value={editForm.checkIn}
                          onChange={(e) => setEditForm(prev => ({ ...prev, checkIn: e.target.value }))}
                          className="w-28 h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Check Out</Label>
                        <Input
                          type="time"
                          value={editForm.checkOut}
                          onChange={(e) => setEditForm(prev => ({ ...prev, checkOut: e.target.value }))}
                          className="w-28 h-8 text-sm"
                        />
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" onClick={() => saveEdit(entry.id)} className="h-8 w-8 p-0">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} className="h-8 w-8 p-0">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Check In</p>
                        <p className="font-medium">{entry.checkIn}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Check Out</p>
                        <p className="font-medium">{entry.checkOut || 'In progress'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-bold text-primary">{entry.totalHours}h</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(entry)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};