import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";

const Maintenance = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("maintenance_logs")
      .select(`
        *,
        equipment:equipment_id(name, code),
        technician:performed_by(full_name),
        work_order:work_order_id(title)
      `)
      .order("created_at", { ascending: false });

    if (data) setLogs(data);
    if (error) toast.error("Error fetching maintenance logs");
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Maintenance History</h1>
          <p className="text-muted-foreground">
            Complete maintenance activity logs and history
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.created_at), "PPp")}
                    </TableCell>
                    <TableCell>
                      {log.equipment?.code} - {log.equipment?.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {log.maintenance_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.description}
                    </TableCell>
                    <TableCell>{log.technician?.full_name || "-"}</TableCell>
                    <TableCell>
                      {log.duration_hours ? `${log.duration_hours}h` : "-"}
                    </TableCell>
                    <TableCell>
                      {log.cost ? `$${log.cost.toFixed(2)}` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Maintenance;