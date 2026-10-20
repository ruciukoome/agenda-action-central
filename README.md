
# Action Central

Action Central is a comprehensive action item tracking and management application designed to help teams track, manage, and follow up on action items from meetings and discussions.

## Project Overview

Action Central allows users to:
- Create, update, and delete action items
- Assign priorities and deadlines to actions
- Track progress of actions through status updates
- Filter and search actions by various criteria
- View analytics and dashboards for action insights
- Receive email notifications for action updates

## Technology Stack

This project is built with:

- **Frontend**:
  - React 18 with TypeScript
  - Vite for fast development and building
  - Tailwind CSS for styling
  - shadcn/ui for UI components
  - React Router for navigation
  - Tanstack Query for data fetching and state management
  - Recharts for data visualization

- **Backend** (Current: Supabase):
  - Supabase for authentication, database, and storage
  - Supabase Edge Functions for serverless operations
  - PostgreSQL database with Row Level Security

## Development Setup

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd action-central

# Step 3: Install dependencies
npm i

# Step 4: Start the development server
npm run dev
```

## MySQL Migration Guide

Action Central was designed to support multiple database backends. The application currently uses Supabase (PostgreSQL), but includes an alternate MySQL implementation.

### Prerequisites for MySQL Migration

1. MySQL server (5.7+ or 8.0+ recommended)
2. The following NPM packages:
   - mysql2
   - uuid
   - bcryptjs

### Migration Steps

1. **Install Required Dependencies**:
   ```sh
   npm install mysql2 uuid bcryptjs
   ```

2. **Set Up MySQL Database**:
   - Create a new MySQL database
   - Import the schema from `src/integrations/mysql/schema.sql`

3. **Configure Environment Variables**:
   ```
   MYSQL_HOST=your_mysql_host
   MYSQL_USER=your_mysql_username
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DATABASE=action_central
   ```

4. **Update Imports in Your Components**:
   ```typescript
   // From
   import { fetchActions } from '@/lib/actions';
   
   // To
   import { fetchActions } from '@/lib/mysql-actions';
   ```

5. **Replace Authentication Provider**:
   ```typescript
   // In App.tsx or layout component
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

6. **Update Auth Hooks**:
   ```typescript
   // From
   import { useAuth } from '@/lib/auth';
   
   // To
   import { useMySqlAuth } from '@/lib/mysql-auth/auth-context';
   ```

### Key Differences in MySQL Implementation

- **Authentication**: Custom JWT-based authentication instead of Supabase Auth
- **Security**: Application-level security instead of Row Level Security (RLS)
- **Data Operations**: Direct SQL queries instead of Supabase client
- **Real-time**: No built-in real-time capabilities (would need separate implementation)

### Advanced MySQL Configuration

For production use, consider:
- Setting up connection pooling
- Configuring proper indexes for performance
- Setting up regular database backups
- Implementing a caching layer

### Debugging MySQL Connection Issues

To troubleshoot MySQL connection issues, use the enhanced logging and diagnostics:

1. **Run Connection Test**:
   ```typescript
   import { testConnection } from '@/integrations/mysql/client';
   
   // In a component or utility function
   const runDiagnostics = async () => {
     const result = await testConnection();
     console.log('MySQL diagnostics:', result);
   };
   ```

2. **Check Logs for Query Performance**:
   The enhanced client automatically logs query execution times and errors.
   
3. **Common MySQL Connection Issues**:
   - Incorrect credentials
   - Network/firewall restrictions
   - MySQL server configuration 
   - Authentication plugin compatibility

For persistent issues, review the MySQL server logs alongside application logs.

## Deployment

To deploy your Action Central app:
1. Click on the Share -> Publish button in Lovable
2. For custom domains, navigate to Project > Settings > Domains

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Design system

All styling uses semantic tokens defined in `src/index.css` and exposed in `tailwind.config.ts`:
- Core: `background`, `foreground`, `card`, `primary` (brand blue), `secondary`, `muted`, `accent`, `border`, `ring`
- Status: `success`, `warning`, `info`, `destructive` (each with `-foreground` and `-soft`)
- Charts: `chart-1` … `chart-5`
- Shadows: `shadow-card` (cards), `shadow-glow` (marketing only); one `--radius`; font: Inter
- Status mapping: high/overdue = destructive, medium/in progress = warning, low/not started = muted, completed = success, informational = info
- Layout primitives: `PageContainer`, `PageHeader`, `SectionCard`, `EmptyState`, `LoadingState`, `PublicShell` (`src/components/layout/primitives.tsx`)

Rule: never use raw colour classes (`bg-green-100`, `text-red-600`…) or hex values in components — only semantic tokens.
