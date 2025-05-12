
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionItem } from '@/types/action';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionCard } from '@/components/ActionCard';
import { Button } from '@/components/ui/button';
import { AuthUserWrapper } from '@/components/AuthUserWrapper';
import { PasswordChangeForm } from '@/components/PasswordChangeForm';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

export default function MyActions() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  // Fetch actions for the current user
  useEffect(() => {
    const fetchMyActions = async () => {
      if (!user?.email) return;
      
      try {
        const { data, error } = await supabase
          .from('actions')
          .select('*')
          .eq('owner_email', user.email);
        
        if (error) {
          console.error('Error fetching actions:', error);
          return;
        }
        
        // Map the data to ActionItem format
        const mappedActions = data.map(action => ({
          id: action.id,
          description: action.description,
          department: action.department,
          meetingDate: action.meeting_date,
          priority: action.priority,
          ownerEmail: action.owner_email,
          completed: action.completed,
          progressStatus: action.progress_status,
          notes: action.notes || '',
          createdAt: action.created_at,
          updatedAt: action.updated_at,
          dueDate: action.due_date
        }));
        
        setActions(mappedActions);
      } catch (error) {
        console.error('Error fetching actions:', error);
      }
    };
    
    if (user) {
      fetchMyActions();
    }
  }, [user]);

  // Function to handle editing an action
  const handleEditAction = (action: ActionItem) => {
    navigate(`/edit-action/${action.id}`);
  };

  return (
    <AuthUserWrapper>
      {(email) => (
        <div className="container py-6 grid gap-6 md:grid-cols-2">
          <div className={isMobile ? 'order-2' : ''}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">My Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{email}</p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <PasswordChangeForm />
            </div>
          </div>
          
          <div className={isMobile ? 'order-1' : ''}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">My Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {actions.length > 0 ? (
                  actions.map((action) => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      onEdit={handleEditAction}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground">No actions assigned to you yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AuthUserWrapper>
  );
}
