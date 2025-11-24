import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, AlertCircle, AlertOctagon, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAlerts();
    subscribeToAlerts();
  }, []);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from("alerts")
      .select(`
        *,
        equipment:equipment_id(name, code)
      `)
      .order("created_at", { ascending: false });

    if (data) setAlerts(data);
    if (error) toast.error("Error fetching alerts");
  };

  const subscribeToAlerts = () => {
    const channel = supabase
      .channel("alerts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => {
          fetchAlerts();
          toast.info("New alert received");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAcknowledge = async (alertId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("alerts")
      .update({
        is_read: true,
        acknowledged_by: userData.user?.id,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", alertId);

    if (error) {
      toast.error("Error acknowledging alert");
      return;
    }

    toast.success("Alert acknowledged");
    fetchAlerts();
  };

  const severityConfig = {
    info: { icon: Info, variant: "default" as const, color: "text-blue-500", bg: "bg-blue-50" },
    warning: { icon: AlertTriangle, variant: "secondary" as const, color: "text-yellow-600", bg: "bg-yellow-50" },
    error: { icon: AlertCircle, variant: "destructive" as const, color: "text-orange-600", bg: "bg-orange-50" },
    critical: { icon: AlertOctagon, variant: "destructive" as const, color: "text-destructive", bg: "bg-red-50" },
  };

  const filteredAlerts = alerts.filter((alert: any) => {
    if (filter === "unread") return !alert.is_read;
    if (filter === "critical") return alert.severity === "critical";
    return true;
  });

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">System Alerts</h1>
            <p className="text-muted-foreground">
              Monitor and manage system notifications
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              onClick={() => setFilter("unread")}
            >
              Unread
            </Button>
            <Button
              variant={filter === "critical" ? "default" : "outline"}
              onClick={() => setFilter("critical")}
            >
              Critical
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAlerts.map((alert: any) => {
            const config = severityConfig[alert.severity as keyof typeof severityConfig];
            const Icon = config.icon;
            
            return (
              <Card
                key={alert.id}
                className={`${!alert.is_read ? "border-l-4 border-l-primary" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${config.bg}`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="text-lg font-semibold">{alert.title}</h3>
                        <Badge variant={config.variant} className="capitalize">
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.equipment
                          ? `${alert.equipment.code} - ${alert.equipment.name}`
                          : "System Alert"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{alert.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                    {!alert.is_read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Acknowledge
                      </Button>
                    )}
                    {alert.is_read && (
                      <span className="text-xs text-muted-foreground">
                        Acknowledged
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredAlerts.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Alerts</h3>
                <p className="text-muted-foreground">
                  {filter === "unread"
                    ? "All caught up! No unread alerts."
                    : "No alerts to display."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Alerts;