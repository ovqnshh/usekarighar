REVOKE EXECUTE ON FUNCTION public.owns_professional(uuid), public.owns_project(uuid), public.pro_on_project(uuid), public.demo_quote_autofill() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.demo_quote_autofill() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.owns_professional(uuid), public.owns_project(uuid), public.pro_on_project(uuid) TO authenticated;