import { PublicShell } from "@/components/layout/primitives";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpdateSuccess() {
  return (
    <PublicShell>
<div className="flex w-full items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-semibold leading-none tracking-tight text-success">Update Successful</h1>
          <CardDescription>Your action item has been updated successfully</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p>Thank you for updating your action item. Your changes have been saved.</p>
          <p className="mt-4 text-sm text-muted-foreground">
            You can close this window now or return to your email.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => window.close()}>Close Window</Button>
        </CardFooter>
      </Card>
    </div>
    </PublicShell>
  );
}
