import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import VideoChat from "@/components/VideoChat";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RealtimeChannel } from "@supabase/supabase-js";

const Index = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [matchedUserId, setMatchedUserId] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (myUserId) {
        cleanupUser(myUserId);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [myUserId]);

  const cleanupUser = async (userId: string) => {
    try {
      await supabase
        .from('waiting_users')
        .delete()
        .eq('id', userId);
    } catch (error) {
      console.error('Error cleaning up user:', error);
    }
  };

  const findAndMatchStranger = async (myId: string) => {
    try {
      // Find an unmatched user (excluding myself)
      const { data: waitingUsers, error: fetchError } = await supabase
        .from('waiting_users')
        .select('*')
        .eq('is_matched', false)
        .neq('id', myId)
        .order('joined_at', { ascending: true })
        .limit(1);

      if (fetchError) throw fetchError;

      if (waitingUsers && waitingUsers.length > 0) {
        const stranger = waitingUsers[0];
        
        // Update both users as matched
        const { error: updateError } = await supabase
          .from('waiting_users')
          .update({ is_matched: true })
          .in('id', [myId, stranger.id]);

        if (updateError) throw updateError;

        console.log('Match found:', stranger.id);
        setMatchedUserId(stranger.id);
        setIsMatched(true);
        setIsSearching(false);
        
        toast({
          title: "Match found!",
          description: "Connecting you with a stranger...",
        });
      }
    } catch (error) {
      console.error('Error finding match:', error);
    }
  };

  const handleStartChat = async () => {
    setIsSearching(true);
    
    try {
      // Generate a unique ID for this user
      const userId = crypto.randomUUID();
      setMyUserId(userId);

      // Insert user into waiting queue
      const { error: insertError } = await supabase
        .from('waiting_users')
        .insert({
          id: userId,
          socket_id: userId,
          is_matched: false,
        });

      if (insertError) throw insertError;

      console.log('Added to waiting queue:', userId);

      // Try to find a match immediately
      await findAndMatchStranger(userId);

      // Subscribe to realtime changes to detect new users
      const channel = supabase
        .channel('waiting-users-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'waiting_users'
          },
          async (payload) => {
            console.log('New user joined:', payload);
            // Check if we're still searching and someone new joined
            if (!isMatched && payload.new.id !== userId) {
              await findAndMatchStranger(userId);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'waiting_users',
            filter: `id=eq.${userId}`
          },
          (payload) => {
            console.log('My status updated:', payload);
            // Check if we got matched by another user
            if (payload.new.is_matched && !isMatched) {
              setIsMatched(true);
              setIsSearching(false);
              toast({
                title: "Match found!",
                description: "Connecting you with a stranger...",
              });
            }
          }
        )
        .subscribe();

      channelRef.current = channel;

    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: "Error",
        description: "Failed to start searching. Please try again.",
        variant: "destructive",
      });
      setIsSearching(false);
    }
  };

  const handleDisconnect = async () => {
    // Cleanup current user from queue
    if (myUserId) {
      await cleanupUser(myUserId);
    }
    
    // Unsubscribe from channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setIsMatched(false);
    setIsSearching(false);
    setMyUserId(null);
    setMatchedUserId(null);
  };

  if (isSearching || isMatched) {
    return (
      <VideoChat 
        onDisconnect={handleDisconnect}
        isConnected={isMatched}
        myUserId={myUserId}
        matchedUserId={matchedUserId}
      />
    );
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
