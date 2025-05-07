
import React, { useState } from 'react';
import { executeQuery } from '@/integrations/postgres/client';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/**
 * Executes the schema.sql file to set up the PostgreSQL database structure
 */
export async function runDatabaseSchema(): Promise<{ success: boolean, message: string }> {
  try {
    // Read the schema file
    // Note: This won't work in a browser environment
    // This is for demonstration purposes - in a real app, you'd need a backend service
    const schemaContent = `
    -- Create enum types if they don't exist
    DO $$
    BEGIN
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
      
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_priority') THEN
        CREATE TYPE action_priority AS ENUM ('high', 'medium', 'low');
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_progress') THEN
        CREATE TYPE action_progress AS ENUM ('Not Started', '25%', '50%', '75%', '100%');
      END IF;
    END$$;
    
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
      user_id UUID NOT NULL
    );
    
    -- Create index for faster user-based queries if it doesn't exist
    CREATE INDEX IF NOT EXISTS idx_actions_user_id ON actions(user_id);
    `;
    
    // Split the schema into individual statements
    const statements = schemaContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0)
      .map(statement => `${statement};`);
    
    console.log('Executing schema setup with statements:', statements);
    
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
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSchemaSetup = async () => {
    setIsLoading(true);
    try {
      const result = await runDatabaseSchema();
      
      if (result.success) {
        toast.success("Schema Setup Successful", {
          description: result.message,
        });
      } else {
        toast.error("Schema Setup Failed", {
          description: result.message,
        });
      }
    } catch (error) {
      toast.error("Schema Setup Failed", {
        description: `An unexpected error occurred during schema setup: ${(error as Error).message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      className="w-full"
      variant="default"
      onClick={handleSchemaSetup}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting Up Schema...
        </>
      ) : (
        "Set Up Database Schema"
      )}
    </Button>
  );
}
