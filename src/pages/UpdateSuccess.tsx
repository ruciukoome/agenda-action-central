
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function UpdateSuccess() {
  // Change the document title when this page loads
  useEffect(() => {
    document.title = "Update Successful | Action Central";
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-2">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <CardTitle className="text-2xl">Task Updated Successfully</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Thank you for updating your task. Your changes have been applied and the system has been updated.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <div className="space-y-3 w-full">
              <Button asChild className="w-full">
                <Link to="/">Go to Dashboard</Link>
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                You can safely close this window now
              </p>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
