
import { executeQuery } from '@/integrations/postgres/client';
import { toast } from "@/components/ui/use-toast";
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Executes the schema.sql file to set up the PostgreSQL database structure
 */
export async function runDatabaseSchema(): Promise<{ success: boolean, message: string }> {
  try {
    // Read the schema file
    // Note: This won't work in a browser environment
    // This is for demonstration purposes - in a real app, you'd need a backend service
    const schemaContent = `
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
    `;
    
    // Split the schema into individual statements
    const statements = schemaContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0)
      .map(statement => `${statement};`);
    
    // Execute each statement separately
    for (const statement of statements) {
      await executeQuery(statement);
    }
    
    return {
      success: true,
      message: "Database schema successfully applied"
    };
  } catch (error) {
    console.error("Failed to apply database schema:", error);
    return {
      success: false,
      message: `Failed to apply database schema: ${(error as Error).message}`
    };
  }
}

/**
 * Component for the schema setup button
 */
export function SchemaSetupButton() {
  const handleSchemaSetup = async () => {
    try {
      const result = await runDatabaseSchema();
      
      if (result.success) {
        toast({
          title: "Schema Setup Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Schema Setup Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Schema Setup Failed",
        description: `An unexpected error occurred during schema setup: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };
  
  return (
    <button
      className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      onClick={handleSchemaSetup}
    >
      Set Up Database Schema
    </button>
  );
}
