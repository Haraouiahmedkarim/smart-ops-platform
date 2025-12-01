import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  TrendingUp,
  Target,
  Award,
  Clock,
  PlayCircle,
  PauseCircle,
  StopCircle,
  RotateCcw,
} from "lucide-react";
import MetricCard from "@/components/dashboard/MetricCard";
import { toast } from "sonner";

interface ProductionOrder {
  id: string;
  order_number: string;
  product_name: string;
  quantity: number;
  completed_quantity: number;
  status: string;
  oee_score: number | null;
  availability: number | null;
  performance: number | null;
  quality: number | null;
  started_at: string | null;
  target_completion: string | null;
}

interface OperatorAction {
  id: string;
  action_type: string;
  timestamp: string;
  notes: string | null;
}

const MES = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [recentActions, setRecentActions] = useState<OperatorAction[]>([]);
  const [avgOEE, setAvgOEE] = useState(0);
  const [avgAvailability, setAvgAvailability] = useState(0);
  const [avgPerformance, setAvgPerformance] = useState(0);
  const [avgQuality, setAvgQuality] = useState(0);

  useEffect(() => {
    fetchMESData();
    subscribeToRealtime();
  }, []);

  const fetchMESData = async () => {
    const { data: ordersData } = await supabase
      .from("production_orders")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: actionsData } = await supabase
      .from("operator_actions")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(10);

    if (ordersData) {
      setOrders(ordersData);
      
      const activeOrders = ordersData.filter(o => o.status === 'in_progress');
      if (activeOrders.length > 0) {
        setAvgOEE(activeOrders.reduce((sum, o) => sum + (o.oee_score || 0), 0) / activeOrders.length);
        setAvgAvailability(activeOrders.reduce((sum, o) => sum + (o.availability || 0), 0) / activeOrders.length);
        setAvgPerformance(activeOrders.reduce((sum, o) => sum + (o.performance || 0), 0) / activeOrders.length);
        setAvgQuality(activeOrders.reduce((sum, o) => sum + (o.quality || 0), 0) / activeOrders.length);
      }
    }

    if (actionsData) {
      setRecentActions(actionsData);
    }
  };

  const subscribeToRealtime = () => {
    const channel = supabase
      .channel("mes-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "production_orders" },
        () => fetchMESData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "operator_actions" },
        () => fetchMESData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleOperatorAction = async (orderId: string, action: "start" | "stop" | "pause" | "resume" | "reset" | "quality_check") => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to perform this action");
      return;
    }

    const { error } = await supabase
      .from("operator_actions")
      .insert([{
        production_order_id: orderId,
        action_type: action,
        operator_id: user.id,
      }]);

    if (error) {
      toast.error("Failed to record action");
    } else {
      toast.success(`Action "${action}" recorded successfully`);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      in_progress: "default",
      completed: "outline",
      paused: "secondary",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getOEEColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manufacturing Execution System</h1>
          <p className="text-muted-foreground">
            Real-time production monitoring and OEE analytics
          </p>
        </div>

        {/* KPI Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Overall OEE"
            value={`${avgOEE.toFixed(1)}%`}
            icon={Award}
            description="Overall Equipment Effectiveness"
          />
          <MetricCard
            title="Availability"
            value={`${avgAvailability.toFixed(1)}%`}
            icon={Activity}
            description="Machine uptime"
          />
          <MetricCard
            title="Performance"
            value={`${avgPerformance.toFixed(1)}%`}
            icon={TrendingUp}
            description="Production speed"
          />
          <MetricCard
            title="Quality"
            value={`${avgQuality.toFixed(1)}%`}
            icon={Target}
            description="Good parts rate"
          />
        </div>

        {/* Production Orders */}
        <Card className="card-elevated animate-fade-in">
          <CardHeader>
            <CardTitle>Active Production Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>OEE</TableHead>
                  <TableHead>A / P / Q</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      {order.order_number}
                    </TableCell>
                    <TableCell>{order.product_name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>
                            {order.completed_quantity} / {order.quantity}
                          </span>
                          <span>
                            {getProgressPercentage(
                              order.completed_quantity,
                              order.quantity
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                        <Progress
                          value={getProgressPercentage(
                            order.completed_quantity,
                            order.quantity
                          )}
                        />
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {order.oee_score && (
                        <span
                          className={`font-bold ${getOEEColor(order.oee_score)}`}
                        >
                          {order.oee_score.toFixed(1)}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="space-y-0.5">
                        <div>A: {order.availability?.toFixed(1)}%</div>
                        <div>P: {order.performance?.toFixed(1)}%</div>
                        <div>Q: {order.quality?.toFixed(1)}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => handleOperatorAction(order.id, "start")}
                        >
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => handleOperatorAction(order.id, "pause")}
                        >
                          <PauseCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => handleOperatorAction(order.id, "stop")}
                        >
                          <StopCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => handleOperatorAction(order.id, "reset")}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </tr>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Machine State Timeline & Operator Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="card-elevated animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Operator Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        action.action_type === "start"
                          ? "bg-green-500"
                          : action.action_type === "stop"
                          ? "bg-red-500"
                          : action.action_type === "pause"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm capitalize">
                        {action.action_type.replace("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(action.timestamp).toLocaleString()}
                      </p>
                      {action.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {action.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated animate-slide-up">
            <CardHeader>
              <CardTitle>Machine State Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{order.product_name}</span>
                      <span className="text-muted-foreground">
                        {order.order_number}
                      </span>
                    </div>
                    <div className="flex gap-1 h-6">
                      <div className="flex-1 bg-green-500 rounded-l"></div>
                      <div className="flex-1 bg-green-500"></div>
                      <div className="flex-1 bg-yellow-500"></div>
                      <div className="flex-1 bg-green-500"></div>
                      <div className="flex-1 bg-blue-500 rounded-r"></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {order.started_at
                          ? new Date(order.started_at).toLocaleTimeString()
                          : "Not started"}
                      </span>
                      <span>Now</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span>Run</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-500"></div>
                    <span>Idle</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span>Maintenance</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MES;
