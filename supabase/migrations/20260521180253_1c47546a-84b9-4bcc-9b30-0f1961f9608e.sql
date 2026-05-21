-- Add updated_at to insumos
ALTER TABLE public.insumos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Generic timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_insumos_updated_at ON public.insumos;
CREATE TRIGGER update_insumos_updated_at
BEFORE UPDATE ON public.insumos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();