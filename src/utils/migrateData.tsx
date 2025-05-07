/**
 * DATA MIGRATION UTILITY
 * ---------------------
 * This utility helps migrate data from Supabase to a PostgreSQL database.
 * Run this script once to perform the initial data transfer.
 */

import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { executeQuery } from "@/integrations/postgres/client";
import { DbAction } from "@/integrations/postgres/types";
import { toast } from "@/components/ui/use-toast";

export async function migrateActionsToPostgres(): Promise<{ success: boolean, message: string }> {
  try {
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
  const handleMigration = async () => {
    try {
      const result = await migrateActionsToPostgres();
      
      if (result.success) {
        toast({
          title: "Migration Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Migration Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: `An unexpected error occurred during migration: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };
  
  return (
    <button
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      onClick={handleMigration}
    >
      Migrate Supabase Data to PostgreSQL
    </button>
  );
}
