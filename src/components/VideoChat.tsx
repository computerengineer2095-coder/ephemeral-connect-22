import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneOff, Send, MessageSquare, X } from "lucide-react";
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

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
    <div className="min-h-screen bg-background relative">
      {/* Video Area */}
      <div className="h-screen flex flex-col md:flex-row gap-2 p-2">
        {/* Remote Video - Main */}
        <div className="flex-1 relative bg-muted rounded-lg overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full">
            <span className="text-xs font-medium">🌍 Stranger</span>
          </div>
        </div>

        {/* Local Video - Small */}
        <div className="w-full md:w-48 h-32 md:h-auto relative bg-muted rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 right-2 glass px-2 py-1 rounded-full">
            <span className="text-xs">You</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        <Button
          variant="destructive"
          size="icon"
          className="rounded-full w-14 h-14"
          onClick={onDisconnect}
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full w-14 h-14"
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </div>

      {/* Chat Overlay */}
      {isChatOpen && (
        <div className="absolute bottom-0 left-0 right-0 md:bottom-4 md:left-4 md:right-auto md:w-96 z-30">
          <div className="liquid-glass rounded-t-2xl md:rounded-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h3 className="font-semibold text-sm">Chat</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsChatOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="h-80 p-4">
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
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border/30">
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
