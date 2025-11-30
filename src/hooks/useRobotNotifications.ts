import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

type RobotEvent = Tables<"robot_events">;

export const useRobotNotifications = () => {
  useEffect(() => {
    const channel = supabase
      .channel('robot-events-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'robot_events',
        },
        async (payload) => {
          const newEvent = payload.new as RobotEvent;
          
          // Fetch robot name
          const { data: robot } = await supabase
            .from('robots')
            .select('name, code')
            .eq('id', newEvent.robot_id)
            .single();

          if (newEvent.severity === 'error' || newEvent.severity === 'critical') {
            toast.error(`Robot Alert: ${robot?.name || 'Unknown'}`, {
              description: newEvent.description,
              duration: 10000,
            });
          } else if (newEvent.severity === 'warning') {
            toast.warning(`Robot Warning: ${robot?.name || 'Unknown'}`, {
              description: newEvent.description,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};
