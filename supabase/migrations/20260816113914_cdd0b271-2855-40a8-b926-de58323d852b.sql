
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_boss() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.calc_transaction_amounts() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_transaction_update() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.apply_edit_request_decision() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.audit_transaction() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_message() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_on_edit_request() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.lock_day_transactions() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_boss() TO authenticated;
