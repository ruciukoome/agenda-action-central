
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActionItem } from "@/types/action";
import { formatDate } from "@/utils/emailUtils";

interface ActionsTableProps {
  actions: ActionItem[];
  isLoading: boolean;
  selectedActions: string[];
  onSelectAction: (actionId: string) => void;
  onSelectAll: (checked: boolean) => void;
}

export function ActionsTable({
  actions,
  isLoading,
  selectedActions,
  onSelectAction,
  onSelectAll,
}: ActionsTableProps) {
  const renderSkeletons = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
        </TableRow>
      ))}
    </>
  );
  
  return (
    <div className="border rounded-md">
      <Table>
        <TableCaption>
          {actions.length > 0 
            ? `Showing ${actions.length} action${actions.length > 1 ? 's' : ''}` 
            : 'No actions found'}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={
                  actions.length > 0 && 
                  selectedActions.length === actions.length
                } 
                onCheckedChange={onSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Meeting</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Meeting Date</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Owner Email</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            renderSkeletons()
          ) : actions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6">
                No actions found
              </TableCell>
            </TableRow>
          ) : (
            actions.map((action) => (
              <TableRow key={action.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedActions.includes(action.id)} 
                    onCheckedChange={() => onSelectAction(action.id)}
                    aria-label={`Select ${action.description}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{action.description}</TableCell>
                <TableCell>{action.department}</TableCell>
                <TableCell>{formatDate(action.meetingDate)}</TableCell>
                <TableCell>
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    action.priority === "high" ? "bg-red-100 text-red-800" :
                    action.priority === "medium" ? "bg-amber-100 text-amber-800" :
                    "bg-green-100 text-green-800"
                  }`}>
                    {action.priority}
                  </div>
                </TableCell>
                <TableCell>{action.ownerEmail}</TableCell>
                <TableCell>
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    action.completed ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {action.completed ? "Completed" : action.progressStatus}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
