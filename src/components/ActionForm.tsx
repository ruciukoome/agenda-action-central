import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Check, X } from "lucide-react";
import { format } from "date-fns";
import { ActionItem, Department, Priority, ProgressStatus } from "@/types/action";
import { getDepartments, getPriorities, getProgressStatuses } from "@/data/mockActions";
import { generateActionAssignedEmailContent, sendEmail } from "@/utils/emailUtils";

const formSchema = z.object({
  description: z.string().min(5, "Description must be at least 5 characters"),
  department: z.string(),
  meetingDate: z.date(),
  priority: z.enum(["high", "medium", "low"]),
  ownerEmail: z.string().email("Please enter a valid email address"),
  completed: z.boolean().default(false),
  progressStatus: z.enum(["Not Started", "25%", "50%", "75%", "100%", "Continuous"]).default("Not Started"),
  notes: z.string().optional(),
  dueDate: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ActionFormProps {
  actionToEdit?: ActionItem;
  onSave: (action: ActionItem) => void;
}

export function ActionForm({ actionToEdit, onSave }: ActionFormProps) {
  const navigate = useNavigate();
  const [emailSent, setEmailSent] = useState(false);
  
  const defaultValues: Partial<FormValues> = actionToEdit ? {
    description: actionToEdit.description,
    department: actionToEdit.department,
    meetingDate: new Date(actionToEdit.meetingDate),
    priority: actionToEdit.priority as Priority,
    ownerEmail: actionToEdit.ownerEmail,
    completed: actionToEdit.completed,
    progressStatus: actionToEdit.progressStatus as ProgressStatus,
    notes: actionToEdit.notes,
    dueDate: actionToEdit.dueDate ? new Date(actionToEdit.dueDate) : undefined,
  } : {
    meetingDate: new Date(),
    priority: "medium" as Priority,
    completed: false,
    progressStatus: "Not Started" as ProgressStatus,
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  const handleSubmit = async (values: FormValues) => {
    const now = new Date().toISOString();
    
    // Check if the progress status is "100%", and if so, set completed to true
    // Note: "Continuous" actions should not be marked as completed automatically
    if (values.progressStatus === "100%") {
      values.completed = true;
    }
    
    const actionData: ActionItem = {
      id: actionToEdit?.id || Date.now().toString(),
      description: values.description,
      department: values.department as Department,
      meetingDate: values.meetingDate.toISOString(),
      priority: values.priority as Priority,
      ownerEmail: values.ownerEmail,
      completed: values.completed,
      progressStatus: values.progressStatus as ProgressStatus,
      notes: values.notes || "",
      createdAt: actionToEdit?.createdAt || now,
      updatedAt: now,
      dueDate: values.dueDate?.toISOString(),
    };
    
    // In a real implementation, this would save to a database
    onSave(actionData);
    
    // If this is a new action, send an email notification
    if (!actionToEdit) {
      try {
        // Generate email content - this returns a Promise so we need to await it
        const emailContent = await generateActionAssignedEmailContent(actionData);
        
        // In a real implementation, this would connect to an email service
        const sent = await sendEmail(
          values.ownerEmail,
          `New Action Item: ${values.description.substring(0, 50)}...`,
          emailContent
        );
        setEmailSent(sent);
      } catch (error) {
        console.error("Failed to send email notification:", error);
      }
    }
    
    navigate("/");
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{actionToEdit ? "Edit Action Item" : "Create New Action Item"}</CardTitle>
            <CardDescription>
              {actionToEdit 
                ? "Update the details of this action item" 
                : "Add a new action item from your meeting"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the action item..." {...field} className="min-h-24" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getDepartments().map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getPriorities().map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="meetingDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Meeting Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a due date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When should this action be completed by?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="ownerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner's Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The person responsible for completing this action
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Separator className="my-4" />
            
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="progressStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress Status</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Update completed status if progress is 100%
                        // Don't auto-complete "Continuous" actions
                        if (value === "100%") {
                          form.setValue("completed", true);
                        }
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select progress" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getProgressStatuses().map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="completed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Completed</FormLabel>
                      <FormDescription>
                        Mark this action as completed
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          // Update progress status if completed is checked
                          // Don't change "Continuous" to "100%" when completed
                          if (checked && form.getValues("progressStatus") !== "Continuous") {
                            form.setValue("progressStatus", "100%");
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional notes or context..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate("/")}
            >
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button type="submit">
              <Check className="w-4 h-4 mr-2" /> {actionToEdit ? "Update" : "Create"} Action
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
