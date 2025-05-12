
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionItem } from '@/types/action';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionCard } from '@/components/ActionCard';
import { Button } from '@/components/ui/button';
import { PasswordChangeForm } from '@/components/PasswordChangeForm';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/lib/auth';

export default function MyActions() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const email = user?.email || '';

  // For demo purposes, we'll filter the actions by the user's email
  const fetchMyActions = async (email: string) => {
    try {
      // In a real app, we'd fetch actions from the server
      const response = await fetch('/api/actions');
      const data = await response.json();
      const filtered = data.filter((action: ActionItem) => action.ownerEmail === email);
      setActions(filtered);
    } catch (error) {
      console.error('Error fetching actions:', error);
      // Use mock data as a fallback
      setActions([]);
    }
  };

  useEffect(() => {
    if (email) {
      fetchMyActions(email);
    }
  }, [email]);

  return (
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
                  onEdit={() => navigate(`/edit-action/${action.id}`)}
                />
              ))
            ) : (
              <p className="text-muted-foreground">No actions assigned to you yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
