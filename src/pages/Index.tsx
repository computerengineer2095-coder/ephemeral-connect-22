import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Video, MessageSquare, Globe, Shuffle } from "lucide-react";

const Index = () => {
  const [isSearching, setIsSearching] = useState(false);

  const handleStartChat = () => {
    setIsSearching(true);
    // TODO: Implement matching logic
    setTimeout(() => {
      console.log("Searching for a stranger...");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 animate-pulse" 
           style={{ animationDuration: '8s' }} />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo/Brand */}
        <div className="mb-12 text-center">
          <div className="inline-block p-4 rounded-2xl glass neon-glow mb-6">
            <Video className="w-16 h-16 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse" 
              style={{ animationDuration: '3s' }}>
            RandomChat
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Connect with strangers worldwide. Anonymous. Instant. Ephemeral.
          </p>
        </div>

        {/* Main CTA */}
        <div className="flex flex-col items-center gap-6 mb-12">
          <Button
            size="lg"
            onClick={handleStartChat}
            disabled={isSearching}
            className="text-lg px-12 py-8 rounded-full bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <>
                <Shuffle className="mr-2 h-6 w-6 animate-spin" />
                Finding stranger...
              </>
            ) : (
              <>
                <Video className="mr-2 h-6 w-6" />
                Start Video Chat
              </>
            )}
          </Button>
          
          {isSearching && (
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          <div className="glass p-6 rounded-2xl text-center group hover:border-primary/50 transition-all duration-300">
            <Video className="w-10 h-10 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">HD Video</h3>
            <p className="text-sm text-muted-foreground">
              Crystal clear peer-to-peer video streaming
            </p>
          </div>
          
          <div className="glass p-6 rounded-2xl text-center group hover:border-secondary/50 transition-all duration-300">
            <MessageSquare className="w-10 h-10 mx-auto mb-4 text-secondary group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">Text Chat</h3>
            <p className="text-sm text-muted-foreground">
              Instant messaging alongside video
            </p>
          </div>
          
          <div className="glass p-6 rounded-2xl text-center group hover:border-primary/50 transition-all duration-300">
            <Globe className="w-10 h-10 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">Global Reach</h3>
            <p className="text-sm text-muted-foreground">
              See your chat partner's country
            </p>
          </div>
        </div>

        {/* Privacy notice */}
        <div className="mt-12 max-w-2xl text-center">
          <p className="text-xs text-muted-foreground">
            🔒 <strong>Privacy First:</strong> No sign-up required. No chat logs. No data stored. 
            All conversations are completely anonymous and ephemeral.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
