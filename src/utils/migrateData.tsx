
import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { executeQuery } from "@/integrations/postgres/client";
import { DbAction } from "@/integrations/postgres/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/**
 * DATA MIGRATION UTILITY
 * ---------------------
 * This utility helps migrate data from Supabase to a PostgreSQL database.
 * Run this script once to perform the initial data transfer.
 */
export async function migrateActionsToPostgres(): Promise<{ success: boolean, message: string }> {
  try {
    console.log('Starting migration from Supabase to PostgreSQL');
    
    // 1. Fetch all actions from Supabase
    const { data: actions, error } = await supabase
      .from('actions')
      .select('*');
      
    if (error) {
      throw new Error(`Failed to fetch actions from Supabase: ${error.message}`);
    }
    
    if (!actions || actions.length === 0) {
      return { success: true, message: "No actions found to migrate" };
    }
    
    console.log(`Found ${actions.length} actions to migrate`);
    
    // 2. Insert actions into PostgreSQL database
    const insertedCount = await insertActionsIntoPostgres(actions as DbAction[]);
    
    return {
      success: true,
      message: `Successfully migrated ${insertedCount} of ${actions.length} actions to PostgreSQL`
    };
  } catch (error) {
    console.error("Migration failed:", error);
    return {
      success: false,
      message: `Migration failed: ${(error as Error).message}`
    };
  }
}

async function insertActionsIntoPostgres(actions: DbAction[]): Promise<number> {
  let insertedCount = 0;
  
  for (const action of actions) {
    try {
      console.log(`Migrating action: ${action.id}`);
      // Prepare the query for each action
      const query = `
        INSERT INTO actions (
          id, description, department, meeting_date, priority, owner_email, 
          completed, progress_status, notes, created_at, updated_at, due_date, user_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
        ON CONFLICT (id) DO NOTHING
      `;
      
      const params = [
        action.id,
        action.description,
        action.department,
        action.meeting_date,
        action.priority,
        action.owner_email,
        action.completed,
        action.progress_status,
        action.notes,
        action.created_at,
        action.updated_at,
        action.due_date,
        action.user_id
      ];
      
      const result = await executeQuery(query, params);
      if ((result as any).rowCount > 0) {
        insertedCount++;
      }
    } catch (err) {
      console.error(`Failed to insert action ${action.id}:`, err);
      // Continue with the next action instead of failing the entire migration
    }
  }
  
  return insertedCount;
}

export function MigrationButton() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleMigration = async () => {
    setIsLoading(true);
    try {
      const result = await migrateActionsToPostgres();
      
      if (result.success) {
        toast.success("Migration Successful", {
          description: result.message,
        });
      } else {
        toast.error("Migration Failed", {
          description: result.message,
        });
      }
    } catch (error) {
      toast.error("Migration Failed", {
        description: `An unexpected error occurred during migration: ${(error as Error).message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button
      className="w-full bg-blue-500 hover:bg-blue-600"
      variant="default"
      onClick={handleMigration}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Migrating Data...
        </>
      ) : (
        "Migrate Supabase Data to PostgreSQL"
      )}
    </Button>
  );
}
