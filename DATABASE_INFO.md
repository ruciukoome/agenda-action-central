
# Action Central Database Information

## General Information
- **Database Type**: PostgreSQL (managed by Supabase)
- **Project ID**: mdwrmfqjxakhpwmfyvft
- **Project URL**: https://mdwrmfqjxakhpwmfyvft.supabase.co

## Tables

### 1. actions
Main table storing action items to be tracked.

**Columns:**
- `id` (uuid, PK): Unique identifier
- `description` (text): Description of the action
- `department` (enum): Department responsible (Engineering, Marketing, Sales, etc.)
- `meeting_date` (timestamp): Date when action was created/assigned
- `priority` (enum): Priority level (high, medium, low)
- `owner_email` (text): Email of the person responsible
- `completed` (boolean): Whether the action is completed
- `progress_status` (enum): Progress status (Not Started, 25%, 50%, 75%, 100%)
- `notes` (text, nullable): Additional notes about the action
- `due_date` (timestamp, nullable): When the action should be completed
- `user_id` (uuid): ID of the user who created the action
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

### 2. profiles
Table storing user profile information.

**Columns:**
- `id` (uuid, PK): User ID (matches auth.users.id)
- `avatar_url` (text, nullable): URL to user's avatar image
- `full_name` (text, nullable): User's full name
- `created_at` (timestamp): Creation timestamp
- `updated_at` (timestamp): Last update timestamp

## Enums

### 1. action_department
Possible departments for action items:
- Engineering
- Marketing
- Sales
- Finance
- HR
- Operations
- Product
- Design
- Customer Success
- Other

### 2. action_priority
Priority levels for actions:
- high
- medium
- low

### 3. action_progress
Progress status values:
- Not Started
- 25%
- 50%
- 75%
- 100%

## Backend Integration
The application uses Supabase Client for database interactions, available in `src/integrations/supabase/client.ts`

## Scheduled Jobs
A daily job runs at midnight to check for actions due the next day and send reminder emails.
