
-- PostgreSQL schema setup for Action Items application

-- Create enum types if they don't exist
DO $$ 
BEGIN
    -- Check if action_department type exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_department') THEN
        CREATE TYPE action_department AS ENUM (
            'NTSA/KRA',
            'Biashara',
            'Agribusiness',
            'Business Development & Strategy',
            'Finance',
            'ICT',
            'Credit',
            'Collections & Settlements',
            'Operations',
            'Sales Support & Data',
            'Call Centre',
            'Delinquency',
            'Legal',
            'RISK & COMPLIANCE',
            'HR & Admin',
            'Customer Experience & Marketing',
            'Asset Finance',
            'Checkoff & Personal Loans'
        );
    END IF;

    -- Check if action_priority type exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_priority') THEN
        CREATE TYPE action_priority AS ENUM ('high', 'medium', 'low');
    END IF;

    -- Check if action_progress type exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_progress') THEN
        CREATE TYPE action_progress AS ENUM ('Not Started', '25%', '50%', '75%', '100%');
    END IF;
END $$;

-- Create actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY,
  description TEXT NOT NULL,
  department action_department NOT NULL,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority action_priority NOT NULL,
  owner_email TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  progress_status action_progress NOT NULL DEFAULT 'Not Started',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP WITH TIME ZONE,
  user_id TEXT NOT NULL
);

-- Create index for faster user-based queries if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'idx_actions_user_id'
    ) THEN
        CREATE INDEX idx_actions_user_id ON actions(user_id);
    END IF;
END $$;
