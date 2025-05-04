
# MySQL Implementation for Action Central

This folder contains an independent implementation of the Action Central application using MySQL instead of Supabase/PostgreSQL.

## Setup Instructions

1. Create a MySQL database named `action_central` (or your preferred name)
2. Import the schema from `schema.sql`
3. Set environment variables:
   - MYSQL_HOST: Your MySQL host (default: localhost)
   - MYSQL_USER: Database username (default: root)
   - MYSQL_PASSWORD: Database password
   - MYSQL_DATABASE: Database name (default: action_central)
4. Install required dependencies:
   - mysql2: For MySQL connection
   - uuid: For UUID generation
   - bcryptjs: For password hashing

## Differences from Supabase Implementation

### Authentication
- Custom JWT-based authentication instead of Supabase Auth
- Manual user creation and profile management

### Security
- Application-level security instead of Row Level Security (RLS)
- Manual permission checks in API functions

### Data Operations
- Direct SQL queries instead of Supabase client
- Manual transaction management

### Real-time
- Does not include real-time capabilities (would need separate implementation)

## Integration Steps

To switch from Supabase to this MySQL implementation:

1. Replace imports in your components:
   ```typescript
   // From
   import { fetchActions } from '@/lib/actions';
   
   // To
   import { fetchActions } from '@/lib/mysql-actions';
   ```

2. Replace authentication provider:
   ```typescript
   // In App.tsx
   import { MySqlAuthProvider } from '@/lib/mysql-auth/auth-context';
   
   // Replace
   <AuthProvider>
     {/* app content */}
   </AuthProvider>
   
   // With
   <MySqlAuthProvider>
     {/* app content */}
   </MySqlAuthProvider>
   ```

3. Update auth hooks:
   ```typescript
   // From
   import { useAuth } from '@/lib/auth';
   
   // To
   import { useMySqlAuth } from '@/lib/mysql-auth/auth-context';
   ```
