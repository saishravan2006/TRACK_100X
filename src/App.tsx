import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthWrapper from "./components/AuthWrapper";
import NotFound from "./pages/NotFound";
import StartupVideo from "./components/StartupVideo";

const queryClient = new QueryClient();

const App = () => {
  const [showStartupVideo, setShowStartupVideo] = useState(true);

  // Check if user has already seen the video in this session
  useEffect(() => {
    const hasSeenVideo = sessionStorage.getItem('hasSeenStartupVideo');
    if (hasSeenVideo) {
      setShowStartupVideo(false);
    }
  }, []);

  const handleVideoEnd = () => {
    sessionStorage.setItem('hasSeenStartupVideo', 'true');
    setShowStartupVideo(false);
  };

  if (showStartupVideo) {
    return <StartupVideo onVideoEnd={handleVideoEnd} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthWrapper>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthWrapper>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
