import React, { useState, useEffect } from 'react';
import { authService, User, TimeEntry } from '../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Users, Calendar, Settings, Clock } from 'lucide-react';
import { toast } from '../hooks/use-toast';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [allTimeEntries, setAllTimeEntries] = useState<TimeEntry[]>([]);
  const [workingDays, setWorkingDays] = useState(22);
  const [dailyHours, setDailyHours] = useState(8);

  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const users = authService.getAllUsers().filter(u => u.role === 'user');
    const entries = authService.getAllTimeEntries();
    setUsers(users);
    setAllTimeEntries(entries);

    const settings = authService.getMonthlySettings();
    const currentSettings = settings.find(s => s.month === currentMonth);
    if (currentSettings) {
      setWorkingDays(currentSettings.workingDays);
      setDailyHours(currentSettings.dailyHours);
    }
  };

  const updateMonthlySettings = () => {
    authService.setMonthlySettings(currentMonth, workingDays, dailyHours);
    toast({
      title: "Settings updated",
      description: `Working days: ${workingDays}, Daily hours: ${dailyHours}`,
    });
  };

  const getUserMonthlyHours = (userId: string) => {
    const userEntries = allTimeEntries.filter(
      entry => entry.userId === userId && entry.date.startsWith(currentMonth)
    );
    return userEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
  };

  const requiredHours = workingDays * dailyHours;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users and monthly settings</p>
      </div>

      {/* Monthly Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Monthly Settings - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="workingDays">Working Days</Label>
              <Input
                id="workingDays"
                type="number"
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                min="1"
                max="31"
              />
            </div>
            <div>
              <Label htmlFor="dailyHours">Daily Hours</Label>
              <Input
                id="dailyHours"
                type="number"
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                min="1"
                max="24"
                step="0.5"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={updateMonthlySettings} className="w-full">
                Update Settings
              </Button>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm">
              <strong>Total Required Hours:</strong> {requiredHours} hours ({workingDays} days × {dailyHours} hours)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* User Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>User Monthly Reports</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => {
              const userHours = getUserMonthlyHours(user.id);
              const progressPercentage = (userHours / requiredHours) * 100;
              const remainingHours = Math.max(0, requiredHours - userHours);

              return (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{userHours.toFixed(1)}h</p>
                      <p className="text-sm text-muted-foreground">of {requiredHours}h</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, progressPercentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Remaining: {remainingHours.toFixed(1)}h</span>
                      <span className={progressPercentage >= 100 ? 'text-success' : progressPercentage >= 80 ? 'text-warning' : 'text-destructive'}>
                        {progressPercentage >= 100 ? 'Complete' : progressPercentage >= 80 ? 'On Track' : 'Behind'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};