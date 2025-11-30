import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrCode, Download } from "lucide-react";
import { CameraFeed } from "@/components/CameraFeed";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

type Robot = Tables<"robots">;
type RobotEvent = Tables<"robot_events">;

export default function RobotDetail() {
  const { id } = useParams();
  const [robot, setRobot] = useState<Robot | null>(null);
  const [events, setEvents] = useState<RobotEvent[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const [robotData, eventsData] = await Promise.all([
        supabase.from('robots').select('*').eq('id', id).single(),
        supabase.from('robot_events').select('*').eq('robot_id', id).order('created_at', { ascending: false }),
      ]);
      setRobot(robotData.data);
      setEvents(eventsData.data || []);
    };

    fetchData();

    const channel = supabase
      .channel('robot-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'robots', filter: `id=eq.${id}` }, (payload) => {
        setRobot(payload.new as Robot);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'robot_events', filter: `robot_id=eq.${id}` }, (payload) => {
        const newEvent = payload.new as RobotEvent;
        setEvents(prev => [newEvent, ...prev]);
        
        if (newEvent.severity === 'error' || newEvent.severity === 'critical') {
          toast({
            title: `Robot Alert: ${robot?.name}`,
            description: newEvent.description,
            variant: "destructive",
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, toast, robot?.name]);

  const generateQRCode = async () => {
    try {
      const url = window.location.href;
      const qrDataUrl = await QRCode.toDataURL(url);
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `robot-${robot?.code}-qr.png`;
      link.click();
      toast({ title: "QR Code Downloaded" });
    } catch (error) {
      toast({ title: "Error generating QR code", variant: "destructive" });
    }
  };

  const exportPDF = () => {
    toast({ title: "PDF Export", description: "Feature coming soon" });
  };

  if (!robot) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{robot.name}</h1>
          <p className="text-muted-foreground">{robot.code} • {robot.location}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={generateQRCode}>
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={robot.status === 'operational' ? 'default' : 'destructive'}>
                  {robot.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model:</span>
                <span>{robot.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Connection:</span>
                <span>{robot.last_connection ? new Date(robot.last_connection).toLocaleString() : 'Never'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <CameraFeed isAlert={robot.status === 'alert'} />
          <Card>
            <CardHeader>
              <CardTitle>Live Sensor Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Temperature</div>
                  <div className="text-2xl font-bold">68°C</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Vibration</div>
                  <div className="text-2xl font-bold">{robot.status === 'alert' ? '85' : '52'} Hz</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Current</div>
                  <div className="text-2xl font-bold">11.2 A</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{event.event_type.replace('_', ' ').toUpperCase()}</CardTitle>
                  <Badge variant={event.severity === 'error' || event.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {event.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">{event.description}</p>
                <div className="text-xs text-muted-foreground">
                  {new Date(event.created_at).toLocaleString()}
                </div>
                {event.sensor_data && (
                  <pre className="mt-2 text-xs bg-muted p-2 rounded">
                    {JSON.stringify(event.sensor_data, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Related Work Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No work orders found for this robot.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
