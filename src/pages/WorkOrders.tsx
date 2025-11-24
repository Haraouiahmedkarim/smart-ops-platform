import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

const WorkOrders = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    equipment_id: string;
    priority: "low" | "medium" | "high" | "critical";
    maintenance_type: "predictive" | "preventive" | "corrective" | "inspection";
    scheduled_date: string;
  }>({
    title: "",
    description: "",
    equipment_id: "",
    priority: "medium",
    maintenance_type: "preventive",
    scheduled_date: "",
  });

  useEffect(() => {
    fetchData();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const fetchData = async () => {
    const { data: woData } = await supabase
      .from("work_orders")
      .select(`
        *,
        equipment:equipment_id(name, code),
        assigned:assigned_to(full_name),
        creator:created_by(full_name)
      `)
      .order("created_at", { ascending: false });

    const { data: equipData } = await supabase
      .from("equipment")
      .select("id, name, code");

    if (woData) setWorkOrders(woData);
    if (equipData) setEquipment(equipData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("work_orders").insert([
      {
        ...formData,
        created_by: user?.id,
        status: "pending",
      },
    ]);

    if (error) {
      toast.error("Error creating work order");
      return;
    }

    toast.success("Work order created successfully");
    setDialogOpen(false);
    setFormData({
      title: "",
      description: "",
      equipment_id: "",
      priority: "medium",
      maintenance_type: "preventive",
      scheduled_date: "",
    });
    fetchData();
  };

  const priorityColors = {
    low: "default",
    medium: "secondary",
    high: "destructive",
    critical: "destructive",
  };

  const statusColors = {
    pending: "secondary",
    in_progress: "default",
    completed: "outline",
    cancelled: "destructive",
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Work Orders</h1>
            <p className="text-muted-foreground">
              Manage maintenance work orders and tasks
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Work Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Work Order</DialogTitle>
                <DialogDescription>
                  Schedule maintenance work for equipment
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="equipment">Equipment</Label>
                    <Select
                      value={formData.equipment_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, equipment_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipment.map((eq: any) => (
                          <SelectItem key={eq.id} value={eq.id}>
                            {eq.code} - {eq.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: "low" | "medium" | "high" | "critical") =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_type">Maintenance Type</Label>
                    <Select
                      value={formData.maintenance_type}
                      onValueChange={(value: "predictive" | "preventive" | "corrective" | "inspection") =>
                        setFormData({ ...formData, maintenance_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="predictive">Predictive</SelectItem>
                        <SelectItem value="preventive">Preventive</SelectItem>
                        <SelectItem value="corrective">Corrective</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_date">Scheduled Date</Label>
                    <Input
                      id="scheduled_date"
                      type="datetime-local"
                      value={formData.scheduled_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          scheduled_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Work Order</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader />
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.map((wo: any) => (
                  <TableRow key={wo.id}>
                    <TableCell className="font-medium">{wo.title}</TableCell>
                    <TableCell>
                      {wo.equipment?.code} - {wo.equipment?.name}
                    </TableCell>
                    <TableCell className="capitalize">
                      {wo.maintenance_type}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          priorityColors[
                            wo.priority as keyof typeof priorityColors
                          ] as any
                        }
                        className="capitalize"
                      >
                        {wo.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusColors[
                            wo.status as keyof typeof statusColors
                          ] as any
                        }
                        className="capitalize"
                      >
                        {wo.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {wo.scheduled_date
                        ? format(new Date(wo.scheduled_date), "PPp")
                        : "-"}
                    </TableCell>
                    <TableCell>{wo.creator?.full_name || "-"}</TableCell>
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

export default WorkOrders;