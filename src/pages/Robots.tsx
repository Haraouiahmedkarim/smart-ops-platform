import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";

type Robot = Tables<"robots">;

const statusColors = {
  operational: "bg-green-500",
  alert: "bg-red-500",
  offline: "bg-gray-500",
  maintenance: "bg-yellow-500",
};

export default function Robots() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRobots = async () => {
      const { data } = await supabase.from('robots').select('*').order('created_at', { ascending: false });
      setRobots(data || []);
    };

    fetchRobots();

    const channel = supabase
      .channel('robots-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'robots' }, fetchRobots)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeCount = robots.filter(r => r.status === 'operational').length;
  const alertCount = robots.filter(r => r.status === 'alert').length;
  const offlineCount = robots.filter(r => r.status === 'offline').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Robot Monitoring</h1>
        <p className="text-muted-foreground">Real-time robot status and diagnostics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Robots</CardTitle>
            <Bot className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <Bot className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offlineCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {robots.map((robot) => (
          <Card key={robot.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/robots/${robot.id}`)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{robot.name}</CardTitle>
                <div className={`w-3 h-3 rounded-full ${statusColors[robot.status]}`} />
              </div>
              <CardDescription>{robot.code}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Location:</span>
                <span>{robot.location || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Model:</span>
                <span>{robot.model || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={robot.status === 'operational' ? 'default' : robot.status === 'alert' ? 'destructive' : 'secondary'}>
                  {robot.status}
                </Badge>
              </div>
              <Button className="w-full mt-4" onClick={() => navigate(`/robots/${robot.id}`)}>
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
