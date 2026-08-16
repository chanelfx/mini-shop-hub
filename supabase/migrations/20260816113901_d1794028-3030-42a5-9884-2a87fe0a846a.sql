
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('employee','boss');
CREATE TYPE public.txn_type AS ENUM ('new_sim','sim_swap','movies_songs','phone_software');
CREATE TYPE public.request_status AS ENUM ('pending','approved','rejected');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'employee',
  avatar_url text,
  must_change_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_boss()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'boss')
$$;

CREATE POLICY "profiles readable by self or boss" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_boss());
CREATE POLICY "profiles insert self" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles update self or boss" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_boss()) WITH CHECK (id = auth.uid() OR public.is_boss());

CREATE POLICY "roles readable by self or boss" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_boss());

-- BUSINESS SETTINGS (singleton)
CREATE TABLE public.business_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  employee_percentage numeric(5,2) NOT NULL DEFAULT 40,
  boss_percentage numeric(5,2) NOT NULL DEFAULT 60,
  currency text NOT NULL DEFAULT 'RWF',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pct_sum CHECK (employee_percentage + boss_percentage = 100),
  CONSTRAINT pct_range CHECK (employee_percentage >= 0 AND boss_percentage >= 0)
);
GRANT SELECT ON public.business_settings TO authenticated;
GRANT UPDATE ON public.business_settings TO authenticated;
GRANT ALL ON public.business_settings TO service_role;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.business_settings (id) VALUES (true);
CREATE POLICY "settings readable" ON public.business_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings updatable by boss" ON public.business_settings FOR UPDATE TO authenticated
  USING (public.is_boss()) WITH CHECK (public.is_boss());

-- DAY CLOSURES
CREATE TABLE public.day_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_date date NOT NULL UNIQUE,
  closed_by uuid NOT NULL REFERENCES auth.users(id),
  closed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.day_closures TO authenticated;
GRANT ALL ON public.day_closures TO service_role;
ALTER TABLE public.day_closures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "closures readable" ON public.day_closures FOR SELECT TO authenticated USING (true);
CREATE POLICY "closures insert" ON public.day_closures FOR INSERT TO authenticated
  WITH CHECK (closed_by = auth.uid());

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type public.txn_type NOT NULL,
  business_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  gross_amount numeric(14,2) NOT NULL DEFAULT 0,
  airtime_cost numeric(14,2) NOT NULL DEFAULT 0 CHECK (airtime_cost >= 0),
  net_amount numeric(14,2) NOT NULL DEFAULT 0,
  employee_percentage numeric(5,2) NOT NULL DEFAULT 40,
  boss_percentage numeric(5,2) NOT NULL DEFAULT 60,
  employee_amount numeric(14,2) NOT NULL DEFAULT 0,
  boss_amount numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'active',
  is_locked boolean NOT NULL DEFAULT false,
  edit_unlocked boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid,
  deletion_reason text
);
CREATE INDEX idx_txn_date ON public.transactions (business_date);
CREATE INDEX idx_txn_user ON public.transactions (user_id);
CREATE INDEX idx_txn_created ON public.transactions (created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- server-side money calculation
CREATE OR REPLACE FUNCTION public.calc_transaction_amounts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.business_settings%ROWTYPE;
BEGIN
  SELECT * INTO s FROM public.business_settings WHERE id;
  IF NEW.transaction_type <> 'new_sim' THEN NEW.airtime_cost := 0; END IF;
  NEW.gross_amount := ROUND(NEW.quantity * NEW.unit_price, 2);
  NEW.net_amount := ROUND(NEW.gross_amount - NEW.airtime_cost, 2);
  NEW.employee_percentage := s.employee_percentage;
  NEW.boss_percentage := s.boss_percentage;
  NEW.employee_amount := ROUND(NEW.net_amount * s.employee_percentage / 100, 2);
  NEW.boss_amount := ROUND(NEW.net_amount - NEW.employee_amount, 2);
  IF TG_OP = 'UPDATE' THEN NEW.updated_at := now(); END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_locked := EXISTS (SELECT 1 FROM public.day_closures d WHERE d.business_date = NEW.business_date);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_calc_txn BEFORE INSERT OR UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.calc_transaction_amounts();

CREATE POLICY "txn select own or boss" ON public.transactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_boss());
CREATE POLICY "txn insert own" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND created_by = auth.uid());
CREATE POLICY "txn update" ON public.transactions FOR UPDATE TO authenticated
  USING (public.is_boss() OR (user_id = auth.uid() AND (NOT is_locked OR edit_unlocked)))
  WITH CHECK (public.is_boss() OR (user_id = auth.uid() AND (NOT is_locked OR edit_unlocked)));
CREATE POLICY "txn delete boss only" ON public.transactions FOR DELETE TO authenticated
  USING (public.is_boss());

-- prevent employees from tampering with lock flags
CREATE OR REPLACE FUNCTION public.guard_transaction_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_boss() THEN
    IF NEW.is_locked IS DISTINCT FROM OLD.is_locked
       OR NEW.edit_unlocked IS DISTINCT FROM OLD.edit_unlocked
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.business_date IS DISTINCT FROM OLD.business_date THEN
      RAISE EXCEPTION 'Not allowed to change protected fields';
    END IF;
    IF OLD.is_locked AND OLD.edit_unlocked THEN
      NEW.edit_unlocked := false; -- consume the one-time approval
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_guard_txn BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.guard_transaction_update();

-- EDIT REQUESTS
CREATE TABLE public.edit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  requested_changes text NOT NULL DEFAULT '',
  status public.request_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.edit_requests TO authenticated;
GRANT ALL ON public.edit_requests TO service_role;
ALTER TABLE public.edit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "req select own or boss" ON public.edit_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid() OR public.is_boss());
CREATE POLICY "req insert own" ON public.edit_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());
CREATE POLICY "req update boss only" ON public.edit_requests FOR UPDATE TO authenticated
  USING (public.is_boss()) WITH CHECK (public.is_boss());

-- when boss approves, unlock that single transaction
CREATE OR REPLACE FUNCTION public.apply_edit_request_decision()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> OLD.status AND NEW.status = 'approved' THEN
    UPDATE public.transactions SET edit_unlocked = true WHERE id = NEW.transaction_id;
  END IF;
  IF NEW.status <> OLD.status THEN
    NEW.reviewed_by := auth.uid();
    NEW.reviewed_at := now();
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (NEW.requested_by, 'edit_request_' || NEW.status,
      'Edit request ' || NEW.status,
      COALESCE(NEW.review_note, 'Your correction request was ' || NEW.status || '.'));
  END IF;
  RETURN NEW;
END; $$;

-- MESSAGES
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (length(trim(message)) > 0),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_msg_participants ON public.messages (sender_id, receiver_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg select participant" ON public.messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "msg insert own" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());
CREATE POLICY "msg mark read" ON public.messages FOR UPDATE TO authenticated
  USING (receiver_id = auth.uid()) WITH CHECK (receiver_id = auth.uid());

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON public.notifications (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif select own" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "notif insert" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "notif update own" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_edit_request_decision BEFORE UPDATE ON public.edit_requests
FOR EACH ROW EXECUTE FUNCTION public.apply_edit_request_decision();

-- AUDIT LOGS (append only)
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_created ON public.audit_logs (created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit select boss or own" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_boss() OR user_id = auth.uid());
CREATE POLICY "audit insert" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.audit_transaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE boss_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
    VALUES (auth.uid(), 'transaction_created', 'transaction', NEW.id, to_jsonb(NEW));
    FOR boss_id IN SELECT user_id FROM public.user_roles WHERE role = 'boss' LOOP
      IF boss_id <> NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (boss_id, 'new_transaction', 'New activity recorded',
          NEW.transaction_type::text || ' x' || NEW.quantity || ' — net ' || NEW.net_amount);
      END IF;
    END LOOP;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (auth.uid(), CASE WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL
      THEN 'transaction_deleted' ELSE 'transaction_edited' END,
      'transaction', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_audit_txn AFTER INSERT OR UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.audit_transaction();

CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (NEW.receiver_id, 'new_message', 'New message', left(NEW.message, 120));
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_message AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

CREATE OR REPLACE FUNCTION public.notify_on_edit_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE boss_id uuid;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'edit_requested', 'edit_request', NEW.id, to_jsonb(NEW));
  FOR boss_id IN SELECT user_id FROM public.user_roles WHERE role = 'boss' LOOP
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (boss_id, 'edit_request', 'New edit request', left(NEW.reason, 120));
  END LOOP;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_edit_request AFTER INSERT ON public.edit_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_on_edit_request();

-- lock all transactions of a day when the day is closed
CREATE OR REPLACE FUNCTION public.lock_day_transactions()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.transactions SET is_locked = true, edit_unlocked = false
  WHERE business_date = NEW.business_date;
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data)
  VALUES (auth.uid(), 'day_closed', 'day_closure', NEW.id, to_jsonb(NEW));
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_lock_day AFTER INSERT ON public.day_closures
FOR EACH ROW EXECUTE FUNCTION public.lock_day_transactions();

-- profile bootstrap on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE desired public.app_role;
BEGIN
  desired := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'employee');
  IF desired = 'boss' AND EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'boss') THEN
    desired := 'employee';
  END IF;
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), desired);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, desired);
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- realtime
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.edit_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.edit_requests;

-- setup status helper (safe: only tells whether accounts exist)
CREATE OR REPLACE FUNCTION public.setup_status()
RETURNS TABLE (has_boss boolean, has_employee boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role='boss'),
         EXISTS (SELECT 1 FROM public.user_roles WHERE role='employee')
$$;
GRANT EXECUTE ON FUNCTION public.setup_status() TO anon, authenticated;
