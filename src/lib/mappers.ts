/**
 * DATA MAPPERS
 * -----------
 * This file contains utility functions to map between frontend and database models
 * Helps translate between the ActionItem type used in the UI and the database schema
 */

import { ActionItem } from "@/types/action";

export function mapDatabaseActionToActionItem(dbAction: any): ActionItem {
  return dbAction as ActionItem;
}

export function mapActionItemToDatabaseAction(action: any): any {
  return action;
}
