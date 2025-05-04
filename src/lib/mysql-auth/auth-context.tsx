
import { createContext, useContext, useEffect, useState } from 'react';
import { executeQuery } from '@/integrations/mysql/client';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface Session {
  user: User;
  token: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// JWT token utility (simplified for example)
const createToken = (user: User): string => {
  // In a real implementation, use a proper JWT library
  return btoa(JSON.stringify({ user, exp: Date.now() + 86400000 })); // 24 hours
};

const parseToken = (token: string): { user: User; exp: number } | null => {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
};

export function MySqlAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on load
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const parsed = parseToken(token);
      if (parsed && parsed.exp > Date.now()) {
        setUser(parsed.user);
        setSession({ user: parsed.user, token });
      } else {
        localStorage.removeItem('auth_token');
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const query = 'SELECT id, email, password, full_name FROM users WHERE email = ?';
      const users = await executeQuery<{ id: string; email: string; password: string; full_name?: string }>(
        query,
        [email]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const user = users[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        throw new Error('Invalid password');
      }

      const userData: User = {
        id: user.id,
        email: user.email,
        full_name: user.full_name
      };

      const token = createToken(userData);
      localStorage.setItem('auth_token', token);
      
      setUser(userData);
      setSession({ user: userData, token });
      
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    setIsLoading(true);
    try {
      // Check if user already exists
      const checkQuery = 'SELECT id FROM users WHERE email = ?';
      const existingUsers = await executeQuery(checkQuery, [email]);
      
      if ((existingUsers as any[]).length > 0) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = uuidv4();
      const now = new Date().toISOString();

      // Create user
      const insertQuery = `
        INSERT INTO users (id, email, password, full_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await executeQuery(insertQuery, [id, email, hashedPassword, fullName || null, now, now]);

      // Create profile
      const profileQuery = `
        INSERT INTO profiles (id, full_name, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `;
      await executeQuery(profileQuery, [id, fullName || null, now, now]);

      const userData: User = { id, email, full_name: fullName };
      const token = createToken(userData);
      localStorage.setItem('auth_token', token);
      
      setUser(userData);
      setSession({ user: userData, token });
      
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useMySqlAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useMySqlAuth must be used within a MySqlAuthProvider');
  }
  return context;
};
