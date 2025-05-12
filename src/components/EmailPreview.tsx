
import { ActionItem } from "@/types/action";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateActionAssignedEmailContent, generateActionDueEmailContent } from "@/utils/emailUtils";

interface EmailPreviewProps {
  action: ActionItem;
}

export function EmailPreview({ action }: EmailPreviewProps) {
  const assignedEmailContent = generateActionAssignedEmailContent(action);
  const dueEmailContent = generateActionDueEmailContent(action);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Email Notifications Preview</CardTitle>
        <CardDescription>
          Preview of automatic emails that will be sent to task owners
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="assigned">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assigned">Task Assigned</TabsTrigger>
            <TabsTrigger value="due">Task Due Soon</TabsTrigger>
          </TabsList>
          <TabsContent value="assigned" className="mt-4">
            <div className="space-y-2">
              <div className="space-y-1">
                <Label>To</Label>
                <div className="rounded-md border px-4 py-2 text-sm">
                  {action.ownerEmail}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <div className="rounded-md border px-4 py-2 text-sm">
                  New Action Item: {action.description.substring(0, 50)}...
                </div>
              </div>
              <div className="space-y-1">
                <Label>From</Label>
                <div className="rounded-md border px-4 py-2 text-sm">
                  joseph.odhiambo@platinumcredit.co.ke
                </div>
              </div>
              <div className="space-y-1">
                <Label>Reply-To</Label>
                <div className="rounded-md border px-4 py-2 text-sm">
                  joseph.odhiambo@platinumcredit.co.ke
                </div>
              </div>
              <div className="space-y-1">
                <Label>Content</Label>
                <div className="rounded-md border p-4 text-sm">
                  <div dangerouslySetInnerHTML={{ __html: assignedEmailContent }} />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="due" className="mt-4">
            <div className="space-y-2">
              <div className="space-y-1">
                <Label>To</Label>
                <div className="rounded-md border px-4 py-2 text-sm">
                  {action.ownerEmail}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <div className="rounded-md border px-4 py-2 text-sm">
                  {action.dueDate && new Date(action.dueDate) < new Date() 
                    ? "OVERDUE: " 
                    : "Reminder: "}
                  Action Item Due Soon - {action.description.substring(0, 40)}...
                </div>
              </div>
              <div className="space-y-1">
                <Label>From</Label>
                <div className="rounded-md border px-4 py-2 text-sm">
                  joseph.odhiambo@platinumcredit.co.ke
                </div>
              </div>
              <div className="space-y-1">
                <Label>Reply-To</Label>
                <div className="rounded-md border px-4 py-2 text-sm">
                  joseph.odhiambo@platinumcredit.co.ke
                </div>
              </div>
              <div className="space-y-1">
                <Label>Content</Label>
                <div className="rounded-md border p-4 text-sm">
                  <div dangerouslySetInnerHTML={{ __html: dueEmailContent }} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>
          Note: In a production environment, these emails include a secure link for users to update their tasks directly without logging in.
          The reply-to address is set to joseph.odhiambo@platinumcredit.co.ke so recipients can respond with questions.
        </p>
      </CardFooter>
    </Card>
  );
}
