import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService, TimeEntry } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Clock, Play, Square, Calendar, Target, TrendingUp } from 'lucide-react';
import { toast } from '../hooks/use-toast';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');

  const currentDate = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentTime = new Date().toTimeString().slice(0, 5);

  useEffect(() => {
    if (user) {
      loadTimeEntries();
      checkTodayStatus();
    }
  }, [user]);

  const loadTimeEntries = () => {
    if (!user) return;
    const entries = authService.getTimeEntries(user.id);
    setTimeEntries(entries);
  };

  const checkTodayStatus = () => {
    if (!user) return;
    const todayEntry = timeEntries.find(entry => entry.date === currentDate);
    if (todayEntry) {
      setCurrentEntry(todayEntry);
      setIsCheckedIn(!todayEntry.checkOut);
      setCheckInTime(todayEntry.checkIn);
      setCheckOutTime(todayEntry.checkOut || '');
    } else {
      setCheckInTime(currentTime);
      setCheckOutTime('');
    }
  };

  const handleCheckIn = () => {
    if (!user || !checkInTime) return;

    try {
      const newEntry = authService.addTimeEntry({
        userId: user.id,
        date: currentDate,
        checkIn: checkInTime,
        checkOut: null,
        totalHours: 0
      });

      setCurrentEntry(newEntry);
      setIsCheckedIn(true);
      loadTimeEntries();
      
      toast({
        title: "Checked in successfully!",
        description: `Check-in time: ${checkInTime}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCheckOut = () => {
    if (!user || !currentEntry || !checkOutTime) return;

    try {
      const checkInDate = new Date(`2000-01-01T${currentEntry.checkIn}`);
      const checkOutDate = new Date(`2000-01-01T${checkOutTime}`);
      const totalHours = (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);

      const updatedEntry = authService.updateTimeEntry(currentEntry.id, {
        checkOut: checkOutTime,
        totalHours: Math.round(totalHours * 100) / 100
      });

      setCurrentEntry(updatedEntry);
      setIsCheckedIn(false);
      loadTimeEntries();
      
      toast({
        title: "Checked out successfully!",
        description: `Total hours: ${totalHours.toFixed(2)}h`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate monthly statistics
  const monthlyEntries = timeEntries.filter(entry => entry.date.startsWith(currentMonth));
  const totalHoursThisMonth = monthlyEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
  
  const monthlySettings = authService.getMonthlySettings();
  const currentMonthSettings = monthlySettings.find(s => s.month === currentMonth);
  const requiredHours = currentMonthSettings ? currentMonthSettings.workingDays * currentMonthSettings.dailyHours : 176; // Default 22 days * 8 hours
  const remainingHours = Math.max(0, requiredHours - totalHoursThisMonth);
  
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();
  const remainingWorkDays = Math.max(1, (currentMonthSettings?.workingDays || 22) - monthlyEntries.length);
  const dailyTargetRemaining = remainingHours / remainingWorkDays;

  const todayEntry = timeEntries.find(entry => entry.date === currentDate);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">Track your work hours and stay on target</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Hours</p>
                <p className="text-2xl font-bold text-foreground">
                  {todayEntry ? `${todayEntry.totalHours}h` : '0h'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-gradient-to-br from-success/5 to-success/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-success" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">{totalHoursThisMonth.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="w-8 h-8 text-warning" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Required</p>
                <p className="text-2xl font-bold text-foreground">{requiredHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-accent" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Daily Target</p>
                <p className="text-2xl font-bold text-foreground">{dailyTargetRemaining.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Check In/Out Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Time Tracking - {new Date().toLocaleDateString()}</span>
          </CardTitle>
          <CardDescription>
            {isCheckedIn ? 'You are currently checked in' : 'Check in to start tracking your time'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="checkin">Check-in Time</Label>
              <div className="flex space-x-3">
                <Input
                  id="checkin"
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  disabled={isCheckedIn}
                  className="flex-1"
                />
                <Button
                  onClick={handleCheckIn}
                  disabled={isCheckedIn || !checkInTime}
                  className="bg-success hover:bg-success/90"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Check In
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="checkout">Check-out Time</Label>
              <div className="flex space-x-3">
                <Input
                  id="checkout"
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  disabled={!isCheckedIn}
                  className="flex-1"
                />
                <Button
                  onClick={handleCheckOut}
                  disabled={!isCheckedIn || !checkOutTime}
                  variant="destructive"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Check Out
                </Button>
              </div>
            </div>
          </div>

          {currentEntry && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium mb-2">Today's Activity</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Check-in:</span>
                  <p className="font-medium">{currentEntry.checkIn}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Check-out:</span>
                  <p className="font-medium">{currentEntry.checkOut || 'In progress'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Hours:</span>
                  <p className="font-medium">{currentEntry.totalHours}h</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Progress</CardTitle>
          <CardDescription>Your progress towards monthly targets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Hours Completed</span>
              <span>{totalHoursThisMonth.toFixed(1)} / {requiredHours}h</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary to-primary-glow h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalHoursThisMonth / requiredHours) * 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{remainingHours.toFixed(1)}h</p>
              <p className="text-sm text-muted-foreground">Hours Remaining</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{remainingWorkDays}</p>
              <p className="text-sm text-muted-foreground">Working Days Left</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{dailyTargetRemaining.toFixed(1)}h</p>
              <p className="text-sm text-muted-foreground">Avg. Daily Target</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};