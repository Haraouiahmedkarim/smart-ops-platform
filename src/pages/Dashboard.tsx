import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import MetricCard from "@/components/dashboard/MetricCard";
import EquipmentStatus from "@/components/dashboard/EquipmentStatus";
import RecentAlerts from "@/components/dashboard/RecentAlerts";
import FMSMap from "@/components/FMSMap";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalEquipment: 0,
    operational: 0,
    maintenance: 0,
    pendingWorkOrders: 0,
    completedToday: 0,
    activeAlerts: 0,
  });
  const [equipment, setEquipment] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [oeeData, setOeeData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    subscribeToRealtime();
  }, []);

  const fetchDashboardData = async () => {
    // Fetch equipment
    const { data: equipmentData } = await supabase
      .from("equipment")
      .select("*")
      .order("created_at", { ascending: false });

    if (equipmentData) {
      setEquipment(equipmentData);
      setMetrics((prev) => ({
        ...prev,
        totalEquipment: equipmentData.length,
        operational: equipmentData.filter((e) => e.status === "operational").length,
        maintenance: equipmentData.filter((e) => e.status === "maintenance").length,
      }));
    }

    // Fetch work orders
    const { data: workOrders } = await supabase
      .from("work_orders")
      .select("*");

    if (workOrders) {
      const today = new Date().toISOString().split("T")[0];
      setMetrics((prev) => ({
        ...prev,
        pendingWorkOrders: workOrders.filter((wo) => wo.status === "pending").length,
        completedToday: workOrders.filter(
          (wo) =>
            wo.status === "completed" &&
            wo.completed_at?.startsWith(today)
        ).length,
      }));
    }

    // Fetch alerts
    const { data: alertsData } = await supabase
      .from("alerts")
      .select("*")
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    if (alertsData) {
      setAlerts(alertsData);
      setMetrics((prev) => ({
        ...prev,
        activeAlerts: alertsData.length,
      }));
    }

    // Generate mock OEE data
    setOeeData(
      Array.from({ length: 7 }, (_, i) => ({
        day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
        availability: 85 + Math.random() * 10,
        performance: 80 + Math.random() * 15,
        quality: 90 + Math.random() * 8,
        oee: 70 + Math.random() * 15,
      }))
    );
  };

  const subscribeToRealtime = () => {
    const channel = supabase
      .channel("dashboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "equipment" },
        () => fetchDashboardData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const availability = metrics.totalEquipment > 0
    ? ((metrics.operational / metrics.totalEquipment) * 100).toFixed(1)
    : "0";

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time overview of your maintenance operations
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            title="Total Equipment"
            value={metrics.totalEquipment}
            icon={Activity}
            description="Active assets"
          />
          <MetricCard
            title="Operational"
            value={metrics.operational}
            icon={CheckCircle}
            description={`${availability}% availability`}
          />
          <MetricCard
            title="Under Maintenance"
            value={metrics.maintenance}
            icon={Wrench}
          />
          <MetricCard
            title="Pending Work Orders"
            value={metrics.pendingWorkOrders}
            icon={Clock}
          />
          <MetricCard
            title="Completed Today"
            value={metrics.completedToday}
            icon={TrendingUp}
            trend={{ value: 12, isPositive: true }}
          />
          <MetricCard
            title="Active Alerts"
            value={metrics.activeAlerts}
            icon={AlertTriangle}
          />
        </div>

        {/* Charts and Status */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>OEE Performance (7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={oeeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="oee"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="availability"
                    stroke="hsl(var(--chart-1))"
                  />
                  <Line
                    type="monotone"
                    dataKey="performance"
                    stroke="hsl(var(--chart-2))"
                  />
                  <Line
                    type="monotone"
                    dataKey="quality"
                    stroke="hsl(var(--chart-3))"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { type: "Predictive", count: 12 },
                    { type: "Preventive", count: 24 },
                    { type: "Corrective", count: 8 },
                    { type: "Inspection", count: 15 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* FMS Production Layout */}
        <FMSMap />

        {/* Equipment Status and Alerts */}
        <div className="grid gap-6 md:grid-cols-2">
          <EquipmentStatus equipment={equipment} />
          <RecentAlerts alerts={alerts} />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;