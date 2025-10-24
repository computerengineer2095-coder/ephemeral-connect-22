import { useState } from "react";
import { Button } from "@/components/ui/button";
import VideoChat from "@/components/VideoChat";

const Index = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [isMatched, setIsMatched] = useState(false);

  const handleStartChat = () => {
    setIsSearching(true);
    // Simulate matching with a stranger
    setTimeout(() => {
      setIsSearching(false);
      setIsMatched(true);
    }, 2000);
  };

  const handleDisconnect = () => {
    setIsMatched(false);
    setIsSearching(false);
  };

  if (isMatched) {
    return <VideoChat onDisconnect={handleDisconnect} />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            RandomChat
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Connect with strangers worldwide instantly
          </p>
        </div>

        <Button
          size="lg"
          onClick={handleStartChat}
          disabled={isSearching}
          className="w-full max-w-xs mx-auto h-12 text-base font-medium"
        >
          {isSearching ? "Finding stranger..." : "Start Chat"}
        </Button>

        {isSearching && (
          <div className="flex justify-center gap-1.5">
            <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        <p className="text-xs text-muted-foreground max-w-sm mx-auto pt-4">
          Anonymous • No sign-up • Ephemeral
        </p>
      </div>
    </div>
  );
};

export default Index;
