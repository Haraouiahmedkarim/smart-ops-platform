import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, AlertCircle, AlertOctagon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  title: string;
  severity: string;
  created_at: string;
}

interface RecentAlertsProps {
  alerts: Alert[];
}

const severityConfig = {
  info: { icon: Info, variant: "default" as const, color: "text-blue-500" },
  warning: { icon: AlertTriangle, variant: "secondary" as const, color: "text-yellow-500" },
  error: { icon: AlertCircle, variant: "destructive" as const, color: "text-orange-500" },
  critical: { icon: AlertOctagon, variant: "destructive" as const, color: "text-destructive" },
};

const RecentAlerts = ({ alerts }: RecentAlertsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert) => {
            const config = severityConfig[alert.severity as keyof typeof severityConfig];
            const Icon = config.icon;
            
            return (
              <div key={alert.id} className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant={config.variant} className="capitalize">
                  {alert.severity}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentAlerts;