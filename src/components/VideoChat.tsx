import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneOff, Send, SkipForward } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  text: string;
  sender: "me" | "stranger";
  timestamp: Date;
}

interface VideoChatProps {
  onDisconnect: () => void;
  isConnected: boolean;
  myUserId: string | null;
  matchedUserId: string | null;
}

const VideoChat = ({ onDisconnect, isConnected, myUserId, matchedUserId }: VideoChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const chatChannelRef = useRef<any>(null);
  const signalingChannelRef = useRef<any>(null);

  // Initialize WebRTC and get local video
  useEffect(() => {
    let localStream: MediaStream;

    const initMedia = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Initialize peer connection when we have a match
        if (isConnected && matchedUserId && myUserId) {
          await initializePeerConnection(localStream);
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    initMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (chatChannelRef.current) {
        supabase.removeChannel(chatChannelRef.current);
      }
      if (signalingChannelRef.current) {
        supabase.removeChannel(signalingChannelRef.current);
      }
    };
  }, [isConnected, matchedUserId, myUserId]);

  // Initialize WebRTC peer connection
  const initializePeerConnection = async (localStream: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    });

    peerConnectionRef.current = pc;

    // Add local stream tracks to peer connection
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    // Handle incoming remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate && myUserId) {
        console.log('Sending ICE candidate');
        await supabase
          .from('waiting_users')
          .update({ 
            country: JSON.stringify({ 
              type: 'ice-candidate', 
              candidate: event.candidate 
            }) 
          })
          .eq('id', myUserId);
      }
    };

    // Set up signaling channel
    const signalingChannel = supabase
      .channel(`signaling-${myUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'waiting_users',
          filter: `id=eq.${matchedUserId}`
        },
        async (payload) => {
          console.log('Received signaling message:', payload);
          if (payload.new.country) {
            try {
              const signal = JSON.parse(payload.new.country);
              
              if (signal.type === 'offer') {
                console.log('Received offer');
                await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                
                await supabase
                  .from('waiting_users')
                  .update({ 
                    country: JSON.stringify({ 
                      type: 'answer', 
                      answer: answer 
                    }) 
                  })
                  .eq('id', myUserId);
              } else if (signal.type === 'answer') {
                console.log('Received answer');
                await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
              } else if (signal.type === 'ice-candidate' && signal.candidate) {
                console.log('Received ICE candidate');
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
              }
            } catch (error) {
              console.error('Error handling signal:', error);
            }
          }
        }
      )
      .subscribe();

    signalingChannelRef.current = signalingChannel;

    // Create and send offer if we're the first user (lower ID)
    if (myUserId && matchedUserId && myUserId < matchedUserId) {
      console.log('Creating offer');
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      await supabase
        .from('waiting_users')
        .update({ 
          country: JSON.stringify({ 
            type: 'offer', 
            offer: offer 
          }) 
        })
        .eq('id', myUserId);
    }

    // Set up chat channel
    const chatChannel = supabase
      .channel(`chat-${myUserId}-${matchedUserId}`)
      .on(
        'broadcast',
        { event: 'message' },
        (payload) => {
          console.log('Received message:', payload);
          if (payload.payload.senderId !== myUserId) {
            const newMessage: Message = {
              id: payload.payload.id,
              text: payload.payload.text,
              sender: 'stranger',
              timestamp: new Date(payload.payload.timestamp),
            };
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    chatChannelRef.current = chatChannel;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !myUserId || !matchedUserId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "me",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");

    // Send message via Supabase Realtime
    if (chatChannelRef.current) {
      await chatChannelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload: {
          id: newMessage.id,
          text: newMessage.text,
          senderId: myUserId,
          timestamp: newMessage.timestamp.toISOString(),
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Main Content - Video + Controls */}
      <div className="flex-1 flex flex-col relative">
        {/* Stranger Video - Top */}
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

        {/* Controls - Between Videos */}
        <div className="flex justify-center items-center gap-3 py-3 bg-background/95 border-y border-border/50">
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={onDisconnect}
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={onDisconnect}
          >
            <SkipForward className="w-5 h-5" />
          </Button>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 bg-destructive rounded-full" />
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          </div>
        </div>

        {/* User Video - Bottom */}
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

        {/* Chat Overlay - Desktop (Glass Effect) */}
        {isConnected && (
          <div className="hidden lg:block absolute bottom-4 right-4 w-80 max-h-96">
            <div className="liquid-glass rounded-xl shadow-lg">
              {/* Messages */}
              <ScrollArea className="h-64 p-4">
                <div className="space-y-2">
                  {messages.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
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
                          <p className="text-sm">{message.text}</p>
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
                    className="flex-1 h-9 text-sm bg-background/50"
                  />
                  <Button type="submit" size="icon" className="h-9 w-9">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Chat Overlay - Mobile (YouTube-style transparent) */}
        {isConnected && (
          <div className="lg:hidden absolute bottom-0 left-0 right-0 max-h-64 pointer-events-none">
            {/* Messages Only - Transparent Background */}
            <div className="p-3 space-y-2">
              {messages.slice(-5).map((message) => (
                <div
                  key={message.id}
                  className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm pointer-events-auto"
                >
                  <p className="text-xs font-medium">
                    <span className={message.sender === "me" ? "text-primary" : "text-foreground"}>
                      {message.sender === "me" ? "You" : "Stranger"}
                    </span>
                    {": "}
                    {message.text}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Input - Fixed at Bottom */}
            <form onSubmit={handleSendMessage} className="p-3 bg-background/95 border-t border-border/50 pointer-events-auto">
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
        )}
      </div>
    </div>
  );
};

export default VideoChat;
