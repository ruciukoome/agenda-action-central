
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpdateSuccess() {
  return (
    <div className="container flex items-center justify-center h-screen">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-semibold leading-none tracking-tight text-green-600">Update Successful</h1>
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
  );
}
