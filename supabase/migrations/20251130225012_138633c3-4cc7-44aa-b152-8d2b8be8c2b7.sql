-- Create enum for robot status
CREATE TYPE robot_status AS ENUM ('operational', 'alert', 'offline', 'maintenance');

-- Create enum for robot event types
CREATE TYPE robot_event_type AS ENUM (
  'overheat',
  'vibration_spike', 
  'current_anomaly',
  'connection_lost',
  'battery_low',
  'position_error',
  'sensor_failure'
);

-- Create robots table
CREATE TABLE public.robots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  status robot_status NOT NULL DEFAULT 'operational',
  last_connection TIMESTAMP WITH TIME ZONE,
  location TEXT,
  model TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create robot_events table
CREATE TABLE public.robot_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  robot_id UUID NOT NULL REFERENCES public.robots(id) ON DELETE CASCADE,
  event_type robot_event_type NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'info',
  description TEXT NOT NULL,
  sensor_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on robots table
ALTER TABLE public.robots ENABLE ROW LEVEL SECURITY;

-- Create policies for robots
CREATE POLICY "Robots are viewable by authenticated users"
  ON public.robots FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and technicians can manage robots"
  ON public.robots FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'technician'::app_role));

-- Enable RLS on robot_events table
ALTER TABLE public.robot_events ENABLE ROW LEVEL SECURITY;

-- Create policies for robot_events
CREATE POLICY "Robot events are viewable by authenticated users"
  ON public.robot_events FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "System can create robot events"
  ON public.robot_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage robot events"
  ON public.robot_events FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger for robots
CREATE TRIGGER update_robots_updated_at
  BEFORE UPDATE ON public.robots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for robots and robot_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.robots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.robot_events;

-- Insert sample robot data
INSERT INTO public.robots (name, code, status, last_connection, location, model, description) VALUES
  ('Robot_A1', 'ROB-A1', 'operational', now() - interval '2 minutes', 'Production Line 1', 'ABB IRB 6700', 'Primary assembly robot - Status OK'),
  ('Robot_B7', 'ROB-B7', 'alert', now() - interval '15 minutes', 'Production Line 3', 'KUKA KR 10 R1100', 'Welding robot - High vibration detected');

-- Insert sample robot events
INSERT INTO public.robot_events (robot_id, event_type, severity, description, sensor_data) 
SELECT 
  r.id,
  'vibration_spike',
  'error',
  'Vibration threshold exceeded: 85Hz detected (normal: <60Hz)',
  '{"vibration": 85, "temperature": 68, "current": 12.5}'::jsonb
FROM public.robots r WHERE r.code = 'ROB-B7';

INSERT INTO public.robot_events (robot_id, event_type, severity, description, sensor_data) 
SELECT 
  r.id,
  'overheat',
  'warning',
  'Temperature approaching limit: 78°C (max: 80°C)',
  '{"vibration": 52, "temperature": 78, "current": 11.2}'::jsonb
FROM public.robots r WHERE r.code = 'ROB-B7';