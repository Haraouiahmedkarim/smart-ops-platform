-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'technician', 'operator');
CREATE TYPE public.equipment_status AS ENUM ('operational', 'maintenance', 'down', 'standby');
CREATE TYPE public.work_order_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.work_order_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.maintenance_type AS ENUM ('predictive', 'preventive', 'corrective', 'inspection');
CREATE TYPE public.alert_severity AS ENUM ('info', 'warning', 'error', 'critical');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Equipment/Assets table
CREATE TABLE public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  location TEXT,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  installation_date DATE,
  status equipment_status NOT NULL DEFAULT 'operational',
  last_maintenance TIMESTAMPTZ,
  next_maintenance TIMESTAMPTZ,
  operating_hours DECIMAL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Work orders table
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  status work_order_status NOT NULL DEFAULT 'pending',
  priority work_order_priority NOT NULL DEFAULT 'medium',
  maintenance_type maintenance_type NOT NULL,
  scheduled_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_hours DECIMAL,
  actual_hours DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maintenance logs table
CREATE TABLE public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE NOT NULL,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  maintenance_type maintenance_type NOT NULL,
  description TEXT NOT NULL,
  parts_used TEXT[],
  cost DECIMAL,
  duration_hours DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sensor data table for IoT integration
CREATE TABLE public.sensor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE NOT NULL,
  sensor_type TEXT NOT NULL,
  value DECIMAL NOT NULL,
  unit TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spare parts inventory table
CREATE TABLE public.spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  part_number TEXT UNIQUE,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  minimum_quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost DECIMAL,
  supplier TEXT,
  location TEXT,
  compatible_equipment UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for equipment
CREATE POLICY "Equipment is viewable by authenticated users"
  ON public.equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage equipment"
  ON public.equipment FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can update equipment status"
  ON public.equipment FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'technician'));

-- RLS Policies for work_orders
CREATE POLICY "Work orders are viewable by authenticated users"
  ON public.work_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and technicians can create work orders"
  ON public.work_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'technician')
  );

CREATE POLICY "Admins and assigned technicians can update work orders"
  ON public.work_orders FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    (public.has_role(auth.uid(), 'technician') AND assigned_to = auth.uid())
  );

CREATE POLICY "Admins can delete work orders"
  ON public.work_orders FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for maintenance_logs
CREATE POLICY "Maintenance logs are viewable by authenticated users"
  ON public.maintenance_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and technicians can create maintenance logs"
  ON public.maintenance_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'technician')
  );

-- RLS Policies for alerts
CREATE POLICY "Alerts are viewable by authenticated users"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create alerts"
  ON public.alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can acknowledge alerts"
  ON public.alerts FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for sensor_data
CREATE POLICY "Sensor data is viewable by authenticated users"
  ON public.sensor_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert sensor data"
  ON public.sensor_data FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for spare_parts
CREATE POLICY "Spare parts are viewable by authenticated users"
  ON public.spare_parts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and technicians can manage spare parts"
  ON public.spare_parts FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'technician')
  );

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spare_parts_updated_at
  BEFORE UPDATE ON public.spare_parts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
  );
  
  -- Assign default operator role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operator');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment;
ALTER PUBLICATION supabase_realtime ADD TABLE public.work_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_data;