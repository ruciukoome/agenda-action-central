/**
 * MEETING PICKER
 * Three-mode selector embedded in ActionForm:
 *   - Task only: no meeting (no calendar invite)
 *   - New meeting: creator schedules a meeting; ICS attached
 *   - Existing meeting: attach action to a meeting already in this org
 *
 * Returns its current selection via onChange. The parent form is responsible for
 * actually creating a meeting row when mode === 'new' (so it can store the id on
 * the action it is about to save).
 */
import { useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useMeetings } from "@/hooks/useMeetings";
import { Meeting } from "@/types/action";

export type MeetingMode = "task" | "new" | "existing";

export interface NewMeetingDraft {
  startDate?: Date;
  startTime: string; // "HH:mm"
  endDate?: Date;
  endTime: string;   // "HH:mm"
  timezone: string;
  location: string;
  agenda: string;
}

export interface MeetingPickerValue {
  mode: MeetingMode;
  existingMeetingId?: string;
  newMeeting: NewMeetingDraft;
}

export function emptyNewMeetingDraft(): NewMeetingDraft {
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  return {
    startDate: undefined,
    startTime: "09:00",
    endDate: undefined,
    endTime: "10:00",
    timezone: tz || "UTC",
    location: "",
    agenda: "",
  };
}

export function defaultMeetingPickerValue(): MeetingPickerValue {
  return { mode: "task", existingMeetingId: undefined, newMeeting: emptyNewMeetingDraft() };
}

interface Props {
  value: MeetingPickerValue;
  onChange: (next: MeetingPickerValue) => void;
}

export function MeetingPicker({ value, onChange }: Props) {
  const { meetings, loading } = useMeetings();

  const sortedMeetings = useMemo(() => {
    const now = Date.now();
    const upcoming = meetings.filter(m => new Date(m.startAt).getTime() >= now);
    const past = meetings.filter(m => new Date(m.startAt).getTime() < now);
    return [...upcoming, ...past];
  }, [meetings]);

  const update = (patch: Partial<MeetingPickerValue>) =>
    onChange({ ...value, ...patch });

  const updateNew = (patch: Partial<NewMeetingDraft>) =>
    onChange({ ...value, newMeeting: { ...value.newMeeting, ...patch } });

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-semibold">Meeting</h3>
        <p className="text-xs text-muted-foreground">
          Choose how this action ties to a meeting. Calendar invites (.ics) are only sent for meetings.
        </p>
      </div>

      <RadioGroup
        value={value.mode}
        onValueChange={(v) => update({ mode: v as MeetingMode })}
        className="grid gap-2"
      >
        <div className="flex items-start gap-2">
          <RadioGroupItem id="mode-task" value="task" className="mt-1" />
          <Label htmlFor="mode-task" className="font-normal cursor-pointer">
            <span className="font-medium">Task only</span>
            <span className="block text-xs text-muted-foreground">Owner gets a task email and Accept/Reject buttons. No calendar invite.</span>
          </Label>
        </div>
        <div className="flex items-start gap-2">
          <RadioGroupItem id="mode-new" value="new" className="mt-1" />
          <Label htmlFor="mode-new" className="font-normal cursor-pointer">
            <span className="font-medium">Schedule a new meeting</span>
            <span className="block text-xs text-muted-foreground">All recipients receive an .ics calendar invite for the time you pick.</span>
          </Label>
        </div>
        <div className="flex items-start gap-2">
          <RadioGroupItem id="mode-existing" value="existing" className="mt-1" />
          <Label htmlFor="mode-existing" className="font-normal cursor-pointer">
            <span className="font-medium">Attach to an existing meeting</span>
            <span className="block text-xs text-muted-foreground">Reuse a meeting already created in your organization (same calendar event).</span>
          </Label>
        </div>
      </RadioGroup>

      {value.mode === "new" && (
        <div className="space-y-3 border-t pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !value.newMeeting.startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
                    {value.newMeeting.startDate ? format(value.newMeeting.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={value.newMeeting.startDate}
                    onSelect={(d) => updateNew({ startDate: d ?? undefined, endDate: value.newMeeting.endDate ?? d ?? undefined })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>Start time</Label>
              <Input
                type="time"
                value={value.newMeeting.startTime}
                onChange={(e) => updateNew({ startTime: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !value.newMeeting.endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
                    {value.newMeeting.endDate ? format(value.newMeeting.endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={value.newMeeting.endDate}
                    onSelect={(d) => updateNew({ endDate: d ?? undefined })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label>End time</Label>
              <Input
                type="time"
                value={value.newMeeting.endTime}
                onChange={(e) => updateNew({ endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Input
              value={value.newMeeting.timezone}
              onChange={(e) => updateNew({ timezone: e.target.value })}
              placeholder="e.g. Africa/Nairobi"
            />
            <p className="text-xs text-muted-foreground">IANA timezone. Default is your browser timezone.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Location / link</Label>
            <Input
              value={value.newMeeting.location}
              onChange={(e) => updateNew({ location: e.target.value })}
              placeholder="Boardroom, Zoom link, Google Meet URL…"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Agenda / notes</Label>
            <Textarea
              value={value.newMeeting.agenda}
              onChange={(e) => updateNew({ agenda: e.target.value })}
              placeholder="What will the meeting cover?"
              className="min-h-20"
            />
          </div>
        </div>
      )}

      {value.mode === "existing" && (
        <div className="space-y-2 border-t pt-4">
          <Label>Pick a meeting</Label>
          <Select
            value={value.existingMeetingId || ""}
            onValueChange={(v) => update({ existingMeetingId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading meetings…" : "Select a meeting"} />
            </SelectTrigger>
            <SelectContent>
              {sortedMeetings.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No meetings yet. Create one using “Schedule a new meeting”.
                </div>
              )}
              {sortedMeetings.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {formatMeetingOption(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            All actions attached to the same meeting appear as a single calendar event with everyone listed as attendees.
          </p>
        </div>
      )}
    </div>
  );
}

function formatMeetingOption(m: Meeting): string {
  try {
    const d = new Date(m.startAt);
    return `${m.title} — ${format(d, "PPp")}`;
  } catch {
    return m.title;
  }
}
