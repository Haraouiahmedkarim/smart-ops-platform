-- Create enum for production order status
CREATE TYPE production_order_status AS ENUM ('pending', 'in_progress', 'completed', 'paused', 'cancelled');

-- Create enum for operator action types
CREATE TYPE operator_action_type AS ENUM ('start', 'stop', 'pause', 'resume', 'reset', 'quality_check');

-- Create enum for FMS station status
CREATE TYPE fms_station_status AS ENUM ('running', 'idle', 'maintenance', 'waiting', 'stopped');

-- Create production_orders table for MES
CREATE TABLE public.production_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  completed_quantity INTEGER NOT NULL DEFAULT 0,
  status production_order_status NOT NULL DEFAULT 'pending',
  equipment_id UUID REFERENCES public.equipment(id),
  robot_id UUID REFERENCES public.robots(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  target_completion TIMESTAMP WITH TIME ZONE,
  oee_score NUMERIC(5,2),
  availability NUMERIC(5,2),
  performance NUMERIC(5,2),
  quality NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create operator_actions table for MES
CREATE TABLE public.operator_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_order_id UUID NOT NULL REFERENCES public.production_orders(id) ON DELETE CASCADE,
  action_type operator_action_type NOT NULL,
  operator_id UUID NOT NULL,
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fms_stations table
CREATE TABLE public.fms_stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status fms_station_status NOT NULL DEFAULT 'idle',
  current_product TEXT,
  location_x INTEGER NOT NULL,
  location_y INTEGER NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fms_routes table
CREATE TABLE public.fms_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_type TEXT NOT NULL,
  route_name TEXT NOT NULL,
  station_sequence TEXT[] NOT NULL,
  routing_efficiency NUMERIC(5,2),
  estimated_time INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fms_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fms_routes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for production_orders
CREATE POLICY "Production orders are viewable by authenticated users"
  ON public.production_orders FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and technicians can manage production orders"
  ON public.production_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technician'::app_role));

-- RLS Policies for operator_actions
CREATE POLICY "Operator actions are viewable by authenticated users"
  ON public.operator_actions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create operator actions"
  ON public.operator_actions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for fms_stations
CREATE POLICY "FMS stations are viewable by authenticated users"
  ON public.fms_stations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage FMS stations"
  ON public.fms_stations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for fms_routes
CREATE POLICY "FMS routes are viewable by authenticated users"
  ON public.fms_routes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage FMS routes"
  ON public.fms_routes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_production_orders_updated_at
  BEFORE UPDATE ON public.production_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fms_stations_updated_at
  BEFORE UPDATE ON public.fms_stations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fms_routes_updated_at
  BEFORE UPDATE ON public.fms_routes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.production_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operator_actions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fms_stations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fms_routes;

-- Insert sample production orders
INSERT INTO public.production_orders (order_number, product_name, quantity, completed_quantity, status, started_at, target_completion, oee_score, availability, performance, quality)
VALUES 
  ('PO-001', 'Widget A', 1000, 650, 'in_progress', now() - interval '4 hours', now() + interval '2 days', 82.5, 95.0, 87.5, 99.0),
  ('PO-002', 'Component B', 500, 120, 'in_progress', now() - interval '1 hour', now() + interval '1 day', 75.0, 90.0, 85.0, 98.0);

-- Insert sample FMS stations
INSERT INTO public.fms_stations (station_code, name, status, current_product, location_x, location_y, capacity)
VALUES 
  ('S1', 'Assembly Station 1', 'running', 'Widget A', 100, 100, 2),
  ('S2', 'Quality Control', 'running', 'Widget A', 300, 100, 1),
  ('S3', 'Packaging Station', 'idle', NULL, 500, 100, 3),
  ('S4', 'Assembly Station 2', 'running', 'Component B', 100, 300, 2),
  ('S5', 'Testing Station', 'waiting', NULL, 300, 300, 1),
  ('S6', 'Storage', 'idle', NULL, 500, 300, 5);

-- Insert sample FMS routes
INSERT INTO public.fms_routes (product_type, route_name, station_sequence, routing_efficiency, estimated_time, is_active)
VALUES 
  ('Widget A', 'Standard Widget Route', ARRAY['S1', 'S2', 'S3'], 92.5, 180, true),
  ('Component B', 'Component Route', ARRAY['S4', 'S5', 'S3'], 88.0, 150, true),
  ('Widget A', 'Express Widget Route', ARRAY['S1', 'S3'], 78.0, 120, false);