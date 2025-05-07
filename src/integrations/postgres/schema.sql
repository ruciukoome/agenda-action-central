
-- This SQL script creates the necessary tables in your PostgreSQL database
-- Run this script once to set up your database schema

-- Create enum types
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

CREATE TYPE action_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE action_progress AS ENUM ('Not Started', '25%', '50%', '75%', '100%');

-- Create actions table
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
  user_id UUID NOT NULL
);

-- Create index for faster user-based queries
CREATE INDEX idx_actions_user_id ON actions(user_id);
