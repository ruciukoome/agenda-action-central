
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ProgressStatus } from "@/types/action";

interface UpdateFormProps {
  progress: ProgressStatus;
  setProgress: (value: ProgressStatus) => void;
  isComplete: boolean;
  setIsComplete: (value: boolean) => void;
  notes: string;
  setNotes: (value: string) => void;
}

export function UpdateForm({ 
  progress, 
  setProgress, 
  isComplete, 
  setIsComplete, 
  notes, 
  setNotes 
}: UpdateFormProps) {
  return (
    <>
      <div className="space-y-2 pt-4">
        <Label htmlFor="progress">Progress Status</Label>
        <RadioGroup 
          id="progress" 
          value={progress} 
          onValueChange={(value) => setProgress(value as ProgressStatus)} 
          className="flex gap-4 flex-wrap"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="Not Started" id="not-started" />
            <Label htmlFor="not-started">Not Started</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="25%" id="progress-25" />
            <Label htmlFor="progress-25">25%</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="50%" id="progress-50" />
            <Label htmlFor="progress-50">50%</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="75%" id="progress-75" />
            <Label htmlFor="progress-75">75%</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="100%" id="progress-100" />
            <Label htmlFor="progress-100">100%</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox 
          id="completed" 
          checked={isComplete} 
          onCheckedChange={(checked) => setIsComplete(!!checked)} 
        />
        <Label htmlFor="completed">Mark as completed</Label>
      </div>

      <div className="space-y-2 pt-4">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Add your progress notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-32"
        />
      </div>
    </>
  );
}
