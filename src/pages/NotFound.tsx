
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-[200px] font-bold text-gray-800">404</h1>
          <h2 className="text-4xl font-bold mb-4 text-gray-800">Page Not Found</h2>
          <p className="text-xl text-gray-600 mb-6 max-w-md mx-auto">
            We're sorry, the page you requested could not be found. Please check the URL or go back to the home page.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/")}
            className="px-8 py-6 text-lg"
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
