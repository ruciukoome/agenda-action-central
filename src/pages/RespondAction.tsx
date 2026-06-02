import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";

export default function RespondAction() {
  const { actionId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const decision = searchParams.get("decision");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const run = async () => {
      if (!actionId || !token || (decision !== "accept" && decision !== "reject")) {
        setStatus("error");
        setMessage("Invalid response link.");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("respond-action", {
          body: { actionId, token, decision },
        });
        if (error || !data?.success) {
          throw new Error(data?.error || error?.message || "Could not record response");
        }
        setStatus("success");
        setMessage(
          decision === "accept"
            ? "You've accepted this action. It now appears in your tasks."
            : "You've rejected this action. The creator will be notified."
        );
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.message || "Something went wrong recording your response.");
      }
    };
    run();
  }, [actionId, token, decision]);

  const isAccept = decision === "accept";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            {status === "loading" && <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />}
            {status === "success" && isAccept && <CheckCircle2 className="h-10 w-10 text-green-600" />}
            {status === "success" && !isAccept && <XCircle className="h-10 w-10 text-red-600" />}
            {status === "error" && <AlertTriangle className="h-10 w-10 text-amber-600" />}
          </div>
          <CardTitle>
            {status === "loading"
              ? "Recording your response…"
              : status === "success"
              ? isAccept
                ? "Action accepted"
                : "Action rejected"
              : "Could not record response"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild variant="outline">
            <Link to="/">Go to Action Central</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
