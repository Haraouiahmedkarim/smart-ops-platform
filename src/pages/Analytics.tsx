import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Analytics = () => {
  // Mock data for charts
  const maintenanceTrend = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    preventive: Math.floor(Math.random() * 20) + 10,
    corrective: Math.floor(Math.random() * 15) + 5,
    predictive: Math.floor(Math.random() * 10) + 3,
  }));

  const equipmentDowntime = [
    { name: "Compressor-01", hours: 24 },
    { name: "CNC-Machine-02", hours: 18 },
    { name: "Robot-Arm-03", hours: 12 },
    { name: "Conveyor-Belt-04", hours: 8 },
    { name: "Pump-05", hours: 6 },
  ];

  const costDistribution = [
    { name: "Labor", value: 45 },
    { name: "Parts", value: 30 },
    { name: "Tools", value: 15 },
    { name: "Other", value: 10 },
  ];

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into maintenance operations
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Activity Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={maintenanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="preventive"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="corrective"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="predictive"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipment Downtime (Hours)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={equipmentDowntime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance Cost Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                  <span className="text-sm font-medium">MTBF (Mean Time Between Failures)</span>
                  <span className="text-lg font-bold">247 hrs</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                  <span className="text-sm font-medium">MTTR (Mean Time To Repair)</span>
                  <span className="text-lg font-bold">4.2 hrs</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                  <span className="text-sm font-medium">Overall Equipment Effectiveness (OEE)</span>
                  <span className="text-lg font-bold">82.5%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                  <span className="text-sm font-medium">Planned Maintenance %</span>
                  <span className="text-lg font-bold">73%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-accent rounded-lg">
                  <span className="text-sm font-medium">Avg Cost per Work Order</span>
                  <span className="text-lg font-bold">$1,245</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;