
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_year text;
  next_seq integer;
BEGIN
  current_year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(NULLIF(split_part(order_number, '-', 2), '') AS integer)
  ), 0) + 1
  INTO next_seq
  FROM public.orders
  WHERE order_number LIKE current_year || '-%';
  
  RETURN current_year || '-' || LPAD(next_seq::text, 5, '0');
END;
$$;
