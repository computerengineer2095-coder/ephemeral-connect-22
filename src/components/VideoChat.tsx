import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneOff, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  text: string;
  sender: "me" | "stranger";
  timestamp: Date;
}

interface VideoChatProps {
  onDisconnect: () => void;
}

const VideoChat = ({ onDisconnect }: VideoChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Simulate connection after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnected(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Get user's camera and microphone
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });

    return () => {
      // Cleanup
      if (localVideoRef.current?.srcObject) {
        const tracks = (localVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "me",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");

    // Simulate stranger response (replace with actual WebRTC data channel)
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: "This is a demo response from stranger",
        sender: "stranger",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Video Area - Split Screen */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Local Video - Left Half */}
          <div className="flex-1 relative bg-muted">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full">
              <span className="text-xs font-medium">You</span>
            </div>
          </div>

          {/* Remote Video - Right Half */}
          <div className="flex-1 relative bg-muted">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isConnected && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                <div className="text-center">
                  <div className="animate-pulse text-muted-foreground text-lg font-medium">
                    Connecting...
                  </div>
                </div>
              </div>
            )}
            {isConnected && (
              <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full">
                <span className="text-xs font-medium">🌍 Stranger</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls - Bottom Center on Mobile */}
        <div className="lg:absolute lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2 flex justify-center gap-3 p-4 lg:p-0 z-20">
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full w-14 h-14"
            onClick={onDisconnect}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>

        {/* Chat Overlay - Mobile (YouTube-style) */}
        {isConnected && (
          <div className="lg:hidden">
            <div className="liquid-glass border-t border-border/30">
              {/* Messages - Compact for Mobile */}
              <ScrollArea className="h-48 p-3">
                <div className="space-y-2">
                  {messages.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-4">
                      No messages yet
                    </p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === "me" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-1.5 ${
                            message.sender === "me"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          <p className="text-xs">{message.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border/30">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 h-9 text-sm"
                  />
                  <Button type="submit" size="icon" className="h-9 w-9">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Chat Sidebar - Desktop (Right Side) */}
      {isConnected && (
        <div className="hidden lg:block w-96 border-l border-border">
          <div className="h-full flex flex-col bg-card">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-sm">Chat</h3>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No messages yet. Start chatting!
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "me" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          message.sender === "me"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoChat;
