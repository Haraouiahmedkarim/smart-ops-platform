import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Equipment {
  id: string;
  name: string;
  status: string;
  location: string;
}

interface EquipmentStatusProps {
  equipment: Equipment[];
}

const statusColors = {
  operational: "bg-green-500",
  maintenance: "bg-yellow-500",
  down: "bg-destructive",
  standby: "bg-muted",
};

const EquipmentStatus = ({ equipment }: EquipmentStatusProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipment Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {equipment.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    statusColors[item.status as keyof typeof statusColors]
                  }`}
                />
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.location}</p>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {item.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentStatus;