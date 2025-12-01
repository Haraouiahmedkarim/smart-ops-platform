import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Route } from "lucide-react";

interface Station {
  id: string;
  station_code: string;
  name: string;
  status: string;
  current_product: string | null;
  location_x: number;
  location_y: number;
}

interface FMSRoute {
  id: string;
  product_type: string;
  route_name: string;
  station_sequence: string[];
  routing_efficiency: number | null;
}

const FMSMap = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [routes, setRoutes] = useState<FMSRoute[]>([]);
  const [agvPosition, setAgvPosition] = useState(0);

  useEffect(() => {
    fetchFMSData();
    subscribeToRealtime();

    // Animate AGV movement
    const interval = setInterval(() => {
      setAgvPosition((prev) => (prev + 1) % 6);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const fetchFMSData = async () => {
    const { data: stationsData } = await supabase
      .from("fms_stations")
      .select("*")
      .order("station_code");

    const { data: routesData } = await supabase
      .from("fms_routes")
      .select("*")
      .eq("is_active", true);

    if (stationsData) setStations(stationsData);
    if (routesData) setRoutes(routesData);
  };

  const subscribeToRealtime = () => {
    const channel = supabase
      .channel("fms-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fms_stations" },
        () => fetchFMSData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-500";
      case "idle":
        return "bg-yellow-500";
      case "waiting":
        return "bg-orange-500";
      case "stopped":
        return "bg-red-500";
      case "maintenance":
        return "bg-blue-500";
      default:
        return "bg-muted";
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === "running" ? "default" : status === "stopped" ? "destructive" : "secondary";
    return (
      <Badge variant={variant} className="text-xs">
        {status}
      </Badge>
    );
  };

  const flexibilityScore = stations.length > 0 
    ? ((stations.filter(s => s.status === "running" || s.status === "idle").length / stations.length) * 100).toFixed(1)
    : "0";

  const avgRoutingEfficiency = routes.length > 0
    ? (routes.reduce((sum, r) => sum + (r.routing_efficiency || 0), 0) / routes.length).toFixed(1)
    : "0";

  return (
    <Card className="card-elevated animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            <CardTitle>FMS Production Layout</CardTitle>
          </div>
          <div className="flex gap-2">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Flexibility Score</p>
              <p className="text-lg font-bold text-primary">{flexibilityScore}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Routing Efficiency</p>
              <p className="text-lg font-bold text-primary">{avgRoutingEfficiency}%</p>
            </div>
            <Button size="icon" variant="outline" onClick={fetchFMSData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative bg-muted/20 rounded-lg p-8 min-h-[400px] border border-border">
          {/* Production Stations */}
          {stations.map((station) => (
            <div
              key={station.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-scale-in"
              style={{
                left: `${(station.location_x / 600) * 100}%`,
                top: `${(station.location_y / 400) * 100}%`,
              }}
            >
              <div className="relative group">
                <div
                  className={`w-16 h-16 rounded-lg ${getStatusColor(
                    station.status
                  )} flex items-center justify-center text-white font-bold shadow-lg transition-transform hover:scale-110 ${
                    station.status === "running" ? "pulse-running" : ""
                  }`}
                >
                  {station.station_code}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block z-10 w-48">
                  <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
                    <p className="font-semibold text-sm">{station.name}</p>
                    <div className="mt-1">{getStatusBadge(station.status)}</div>
                    {station.current_product && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Processing: {station.current_product}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Animated AGV/Robot */}
          {stations.length > 0 && (
            <div
              className="absolute w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all duration-1000 ease-in-out z-10"
              style={{
                left: `${(stations[agvPosition]?.location_x / 600) * 100}%`,
                top: `${(stations[agvPosition]?.location_y / 400) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              AGV
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-3 shadow-lg">
            <p className="text-xs font-semibold mb-2">Status Legend</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span>Running</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                <span>Idle</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500"></div>
                <span>Waiting</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span>Stopped</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span>Maintenance</span>
              </div>
            </div>
          </div>

          {/* Active Routes */}
          <div className="absolute bottom-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg max-w-xs">
            <p className="text-xs font-semibold mb-2">Active Routes</p>
            <div className="space-y-2 text-xs">
              {routes.slice(0, 2).map((route) => (
                <div key={route.id} className="border-l-2 border-primary pl-2">
                  <p className="font-medium">{route.route_name}</p>
                  <p className="text-muted-foreground">
                    {route.station_sequence.join(" → ")}
                  </p>
                  {route.routing_efficiency && (
                    <p className="text-primary">
                      Efficiency: {route.routing_efficiency}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FMSMap;
