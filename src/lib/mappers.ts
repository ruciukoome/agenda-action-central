
// This file is kept for future database integration but functions are simplified
import { ActionItem } from "@/types/action";

export function mapDatabaseActionToActionItem(dbAction: any): ActionItem {
  return dbAction as ActionItem;
}

export function mapActionItemToDatabaseAction(action: any): any {
  return action;
}
