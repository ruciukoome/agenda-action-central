import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ActionItem } from "@/types/action";
import { ActionCard } from "@/components/ActionCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDueStatus } from "@/utils/emailUtils";
import { fetchActions } from "@/lib/actions";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

interface MyActionsProps {
  userEmail: string;
  onEditAction: (action: ActionItem) => void;
}

export default function MyActions({ userEmail, onEditAction }: MyActionsProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [actions, setActions] = useState<ActionItem[]>([]);
  
  useEffect(() => {
    const loadActions = async () => {
      try {
        const data = await fetchActions();
        setActions(data.filter(action => 
          action.ownerEmail.toLowerCase() === userEmail.toLowerCase()
        ));
      } catch (error) {
        console.error('Error loading actions:', error);
      }
    };

    loadActions();

    const channel = supabase
      .channel('actions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'actions'
        },
        () => {
          loadActions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userEmail]);

  const userActions = actions.filter(action => 
    action.ownerEmail.toLowerCase() === userEmail.toLowerCase()
  );
  
  const filteredActions = userActions.filter(action =>
    action.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const pendingActions = filteredActions.filter(action => !action.completed);
  const completedActions = filteredActions.filter(action => action.completed);
  const overdueActions = pendingActions.filter(action => 
    action.dueDate && getDueStatus(action.dueDate) === "overdue"
  );
  const upcomingActions = pendingActions.filter(action =>
    action.dueDate && getDueStatus(action.dueDate) === "upcoming"
  );
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Action Items</h1>
        <p className="text-muted-foreground mb-6">Assigned to: {userEmail}</p>
        
        <div className="mb-6">
          <Input
            placeholder="Search your actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">
              All ({filteredActions.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingActions.length})
            </TabsTrigger>
            <TabsTrigger value="overdue" className="text-red-500">
              Overdue ({overdueActions.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-amber-500">
              Upcoming ({upcomingActions.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedActions.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {filteredActions.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-xl font-medium">No action items found</h3>
                <p className="text-muted-foreground mt-2">
                  {searchQuery ? "Try a different search term" : "You don't have any assigned actions yet"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActions.map((action) => (
                  <ActionCard key={action.id} action={action} onEdit={onEditAction} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pending">
            {pendingActions.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-xl font-medium">No pending actions</h3>
                <p className="text-muted-foreground mt-2">
                  {searchQuery ? "Try a different search term" : "Great job! You've completed all your assigned actions"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingActions.map((action) => (
                  <ActionCard key={action.id} action={action} onEdit={onEditAction} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="overdue">
            {overdueActions.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-xl font-medium">No overdue actions</h3>
                <p className="text-muted-foreground mt-2">
                  You're on track with all your deadlines!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {overdueActions.map((action) => (
                  <ActionCard key={action.id} action={action} onEdit={onEditAction} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upcoming">
            {upcomingActions.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-xl font-medium">No upcoming deadlines</h3>
                <p className="text-muted-foreground mt-2">
                  You don't have any actions due in the next few days
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingActions.map((action) => (
                  <ActionCard key={action.id} action={action} onEdit={onEditAction} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed">
            {completedActions.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-xl font-medium">No completed actions</h3>
                <p className="text-muted-foreground mt-2">
                  {searchQuery ? "Try a different search term" : "You haven't completed any actions yet"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedActions.map((action) => (
                  <ActionCard key={action.id} action={action} onEdit={onEditAction} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
