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
import { ActionItem, Department, Priority, ProgressStatus, parseEmailList, formatEmailList } from "@/types/action";
import { getDepartments, getPriorities, getProgressStatuses } from "@/data/mockActions";
import { sendActionNotification } from "@/lib/notifications";
import { useRecentMeetingTitles } from "@/hooks/useRecentMeetingTitles";
import { Loader2, FileText } from "lucide-react";

const formSchema = z
  .object({
    meetingTitle: z.string().min(1, "Meeting title is required"),
    description: z.string().min(5, "Description must be at least 5 characters"),
    department: z.string().min(1, "Department is required"),
    meetingDate: z.date({ required_error: "Meeting date is required" }),
    priority: z.enum(["high", "medium", "low"]),
    ownerEmail: z.string().email("Please enter a valid email address"),
    completed: z.boolean().default(false),
    progressStatus: z
      .enum(["Not Started", "25%", "50%", "75%", "100%", "Continuous"])
      .default("Not Started"),
    notes: z.string().optional(),
    dueDate: z.date().optional(),
    ccEmails: z.string().optional(),
    bccEmails: z.string().optional(),
    allowCompletionException: z.boolean().default(false),
  })
  .refine(
    (data) =>
      !data.completed ||
      data.progressStatus === "100%" ||
      data.progressStatus === "Continuous" ||
      data.allowCompletionException,
    {
      message:
        "Completed actions must be at 100% progress. Enable 'Allow exception' to override.",
      path: ["progressStatus"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

interface ActionFormProps {
  actionToEdit?: ActionItem;
  draftId?: string;
  initialDraft?: Partial<ActionItem>;
  onSave: (action: ActionItem) => void;
  onSaveDraft?: (values: Partial<ActionItem>) => Promise<void> | void;
  onOpenDrafts?: () => void;
  draftCount?: number;
}

export function ActionForm({ actionToEdit, draftId, initialDraft, onSave, onSaveDraft, onOpenDrafts, draftCount }: ActionFormProps) {
  const navigate = useNavigate();
  const [emailSent, setEmailSent] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const recentTitles = useRecentMeetingTitles();

  const source = actionToEdit || initialDraft;
  const defaultValues: Partial<FormValues> = source ? {
    meetingTitle: source.meetingTitle || "",
    description: source.description || "",
    department: (source.department as string) || "",
    meetingDate: source.meetingDate ? new Date(source.meetingDate) : new Date(),
    priority: (source.priority as Priority) || "medium",
    ownerEmail: source.ownerEmail || "",
    completed: source.completed ?? false,
    progressStatus: (source.progressStatus as ProgressStatus) || "Not Started",
    notes: source.notes || "",
    dueDate: source.dueDate ? new Date(source.dueDate) : undefined,
    ccEmails: source.ccEmails ? formatEmailList(source.ccEmails) : "",
    bccEmails: source.bccEmails ? formatEmailList(source.bccEmails) : "",
    allowCompletionException: false,
  } : {
    meetingTitle: "",
    meetingDate: new Date(),
    priority: "medium" as Priority,
    completed: false,
    progressStatus: "Not Started" as ProgressStatus,
    ccEmails: "",
    bccEmails: "",
    allowCompletionException: false,
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
      meetingTitle: values.meetingTitle,
      priority: values.priority as Priority,
      ownerEmail: values.ownerEmail,
      completed: values.completed,
      progressStatus: values.progressStatus as ProgressStatus,
      notes: values.notes || "",
      createdAt: actionToEdit?.createdAt || now,
      updatedAt: now,
      dueDate: values.dueDate?.toISOString(),
      ccEmails: values.ccEmails ? parseEmailList(values.ccEmails) : [],
      bccEmails: values.bccEmails ? parseEmailList(values.bccEmails) : [],
    };

    onSave(actionData);

    // Send email notification
    try {
      const notificationType = actionToEdit ? "updated" : "assigned";
      const result = await sendActionNotification(
        actionData,
        notificationType,
        actionData.ccEmails,
        actionData.bccEmails
      );

      if (result && !result.error) {
        setEmailSent(true);
      }
    } catch (error) {
      console.error("Failed to send email notification:", error);
    }
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;
    const v = form.getValues();
    const draftPayload: Partial<ActionItem> = {
      meetingTitle: v.meetingTitle || undefined,
      description: v.description || undefined,
      department: v.department as Department | undefined,
      meetingDate: v.meetingDate ? v.meetingDate.toISOString() : undefined,
      priority: v.priority as Priority | undefined,
      ownerEmail: v.ownerEmail || undefined,
      progressStatus: v.progressStatus as ProgressStatus | undefined,
      notes: v.notes || undefined,
      dueDate: v.dueDate ? v.dueDate.toISOString() : undefined,
      ccEmails: v.ccEmails ? parseEmailList(v.ccEmails) : [],
      bccEmails: v.bccEmails ? parseEmailList(v.bccEmails) : [],
    };
    setSavingDraft(true);
    try {
      await onSaveDraft(draftPayload);
    } finally {
      setSavingDraft(false);
    }
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
            
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="ccEmails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CC Recipients (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="email1@example.com, email2@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Additional recipients who will receive a copy (visible to all)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bccEmails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BCC Recipients (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="email1@example.com, email2@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Hidden recipients (only visible to sender)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="25%">25%</SelectItem>
                        <SelectItem value="50%">50%</SelectItem>
                        <SelectItem value="75%">75%</SelectItem>
                        <SelectItem value="100%">100%</SelectItem>
                        <SelectItem value="Continuous">Continuous</SelectItem>
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
                          if (checked && form.getValues("progressStatus") !== "Continuous") {
                            form.setValue("progressStatus", "100%", { shouldValidate: true });
                          }
                          form.setValue("allowCompletionException", false, { shouldValidate: true });
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("completed") &&
              form.watch("progressStatus") !== "100%" &&
              form.watch("progressStatus") !== "Continuous" && (
                <FormField
                  control={form.control}
                  name="allowCompletionException"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-3 shadow-sm">
                      <div className="space-y-0.5 pr-3">
                        <FormLabel className="text-amber-900">
                          Allow completion exception
                        </FormLabel>
                        <FormDescription className="text-amber-800">
                          This action is marked completed but progress is{" "}
                          <strong>{form.watch("progressStatus")}</strong>. Enable
                          to explicitly allow this mismatch.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(v) => {
                            field.onChange(v);
                            form.trigger("progressStatus");
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            
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
