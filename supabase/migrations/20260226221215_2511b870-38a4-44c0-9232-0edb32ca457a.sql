
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('administrator', 'planner', 'operator');

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('new', 'ready', 'released', 'in_production', 'completed', 'archived');

-- Create part status enum  
CREATE TYPE public.part_status AS ENUM ('pending', 'in_progress', 'completed', 'rework');

-- Create feedback type enum
CREATE TYPE public.feedback_type AS ENUM ('done', 'rework');

-- User roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    workstation_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Workstations table
CREATE TABLE public.workstations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workstations ENABLE ROW LEVEL SECURITY;

-- Add FK from profiles to workstations
ALTER TABLE public.profiles ADD CONSTRAINT profiles_workstation_id_fkey FOREIGN KEY (workstation_id) REFERENCES public.workstations(id);

-- Customers table
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.customers(id),
    status order_status NOT NULL DEFAULT 'new',
    priority INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    due_date DATE,
    released_at TIMESTAMPTZ,
    released_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Articles table
CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Parts table
CREATE TABLE public.parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    part_number TEXT NOT NULL,
    name TEXT NOT NULL,
    material TEXT,
    length NUMERIC,
    width NUMERIC,
    thickness NUMERIC,
    quantity INTEGER NOT NULL DEFAULT 1,
    status part_status NOT NULL DEFAULT 'pending',
    current_workstation_id UUID REFERENCES public.workstations(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;

-- Part feedback table
CREATE TABLE public.part_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id UUID REFERENCES public.parts(id) ON DELETE CASCADE NOT NULL,
    workstation_id UUID REFERENCES public.workstations(id) NOT NULL,
    operator_id UUID REFERENCES auth.users(id) NOT NULL,
    feedback_type feedback_type NOT NULL,
    rework_reason TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.part_feedback ENABLE ROW LEVEL SECURITY;

-- Order comments
CREATE TABLE public.order_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_comments ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Audit log
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Batches
CREATE TABLE public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number TEXT NOT NULL UNIQUE,
    name TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Downtime events
CREATE TABLE public.downtime_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstation_id UUID REFERENCES public.workstations(id) NOT NULL,
    reason TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    reported_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.downtime_events ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workstations_updated_at BEFORE UPDATE ON public.workstations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON public.parts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON public.batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS POLICIES

-- user_roles: users can read their own roles, admins can manage all
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'administrator'));

-- profiles: users can read all profiles, update own
CREATE POLICY "Authenticated users can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- workstations: authenticated can read, admins can manage
CREATE POLICY "Authenticated can read workstations" ON public.workstations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage workstations" ON public.workstations FOR ALL USING (public.has_role(auth.uid(), 'administrator'));

-- customers: admins and planners can manage
CREATE POLICY "Staff can read customers" ON public.customers FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'planner')
);
CREATE POLICY "Staff can manage customers" ON public.customers FOR ALL USING (
  public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'planner')
);

-- orders: admins/planners full access, operators can read released orders
CREATE POLICY "Staff can manage orders" ON public.orders FOR ALL USING (
  public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'planner')
);
CREATE POLICY "Operators can read released orders" ON public.orders FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'operator') AND status IN ('released', 'in_production', 'completed')
);

-- articles: same as orders
CREATE POLICY "Staff can manage articles" ON public.articles FOR ALL USING (
  public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'planner')
);
CREATE POLICY "Operators can read articles" ON public.articles FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'operator')
);

-- parts: staff full access, operators read parts for their workstation
CREATE POLICY "Staff can manage parts" ON public.parts FOR ALL USING (
  public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'planner')
);
CREATE POLICY "Operators can read parts" ON public.parts FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'operator')
);

-- part_feedback: operators can insert, staff can read
CREATE POLICY "Operators can insert feedback" ON public.part_feedback FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'operator') AND auth.uid() = operator_id
);
CREATE POLICY "Staff can read feedback" ON public.part_feedback FOR SELECT TO authenticated USING (true);

-- order_comments: authenticated can read and insert
CREATE POLICY "Authenticated can read comments" ON public.order_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert comments" ON public.order_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- notifications: users can read/update own
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- audit_log: admins can read
CREATE POLICY "Admins can read audit log" ON public.audit_log FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'administrator')
);
CREATE POLICY "System can insert audit log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- batches: staff can manage
CREATE POLICY "Staff can manage batches" ON public.batches FOR ALL USING (
  public.has_role(auth.uid(), 'administrator') OR public.has_role(auth.uid(), 'planner')
);
CREATE POLICY "Operators can read batches" ON public.batches FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'operator')
);

-- downtime_events: authenticated can read and insert
CREATE POLICY "Authenticated can read downtime" ON public.downtime_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert downtime" ON public.downtime_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can manage downtime" ON public.downtime_events FOR ALL USING (
  public.has_role(auth.uid(), 'administrator')
);
