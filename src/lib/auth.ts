// Mock authentication service
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface TimeEntry {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  totalHours: number;
}

export interface MonthlySettings {
  month: string; // YYYY-MM format
  workingDays: number;
  dailyHours: number;
}

// Mock users data
const mockUsers: User[] = [
  { id: '1', email: 'user@company.com', name: 'John Doe', role: 'user' },
  { id: '2', email: 'admin@company.com', name: 'Admin User', role: 'admin' },
  { id: '3', email: 'jane@company.com', name: 'Jane Smith', role: 'user' }
];

// Mock passwords (in real app, these would be hashed)
const mockPasswords = {
  'user@company.com': 'password123',
  'admin@company.com': 'admin123',
  'jane@company.com': 'password123'
};

class AuthService {
  private tokenKey = 'work_tracker_token';
  private userKey = 'work_tracker_user';
  private timeEntriesKey = 'work_tracker_time_entries';
  private monthlySettingsKey = 'work_tracker_monthly_settings';

  constructor() {
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const existingEntries = localStorage.getItem(this.timeEntriesKey);
    if (!existingEntries) {
      const sampleEntries: TimeEntry[] = [
        {
          id: '1',
          userId: '1',
          date: new Date().toISOString().split('T')[0],
          checkIn: '09:00',
          checkOut: '17:30',
          totalHours: 8.5
        }
      ];
      localStorage.setItem(this.timeEntriesKey, JSON.stringify(sampleEntries));
    }

    const existingSettings = localStorage.getItem(this.monthlySettingsKey);
    if (!existingSettings) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const sampleSettings: MonthlySettings[] = [
        {
          month: currentMonth,
          workingDays: 22,
          dailyHours: 8
        }
      ];
      localStorage.setItem(this.monthlySettingsKey, JSON.stringify(sampleSettings));
    }
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = mockUsers.find(u => u.email === email);
    const expectedPassword = mockPasswords[email as keyof typeof mockPasswords];

    if (!user || password !== expectedPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate mock JWT token
    const token = `mock_jwt_token_${user.id}_${Date.now()}`;
    
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));

    return { user, token };
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  // Time tracking methods
  getTimeEntries(userId: string): TimeEntry[] {
    const entries = localStorage.getItem(this.timeEntriesKey);
    const allEntries: TimeEntry[] = entries ? JSON.parse(entries) : [];
    return allEntries.filter(entry => entry.userId === userId);
  }

  getAllTimeEntries(): TimeEntry[] {
    const entries = localStorage.getItem(this.timeEntriesKey);
    return entries ? JSON.parse(entries) : [];
  }

  addTimeEntry(entry: Omit<TimeEntry, 'id'>): TimeEntry {
    const entries = this.getAllTimeEntries();
    const newEntry: TimeEntry = {
      ...entry,
      id: Date.now().toString()
    };
    entries.push(newEntry);
    localStorage.setItem(this.timeEntriesKey, JSON.stringify(entries));
    return newEntry;
  }

  updateTimeEntry(id: string, updates: Partial<TimeEntry>): TimeEntry {
    const entries = this.getAllTimeEntries();
    const index = entries.findIndex(entry => entry.id === id);
    if (index === -1) throw new Error('Time entry not found');
    
    entries[index] = { ...entries[index], ...updates };
    localStorage.setItem(this.timeEntriesKey, JSON.stringify(entries));
    return entries[index];
  }

  deleteTimeEntry(id: string): void {
    const entries = this.getAllTimeEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    localStorage.setItem(this.timeEntriesKey, JSON.stringify(filteredEntries));
  }

  // Monthly settings methods
  getMonthlySettings(): MonthlySettings[] {
    const settings = localStorage.getItem(this.monthlySettingsKey);
    return settings ? JSON.parse(settings) : [];
  }

  setMonthlySettings(month: string, workingDays: number, dailyHours: number = 8): void {
    const allSettings = this.getMonthlySettings();
    const existingIndex = allSettings.findIndex(s => s.month === month);
    
    const newSetting: MonthlySettings = { month, workingDays, dailyHours };
    
    if (existingIndex >= 0) {
      allSettings[existingIndex] = newSetting;
    } else {
      allSettings.push(newSetting);
    }
    
    localStorage.setItem(this.monthlySettingsKey, JSON.stringify(allSettings));
  }

  getAllUsers(): User[] {
    return mockUsers;
  }
}

export const authService = new AuthService();