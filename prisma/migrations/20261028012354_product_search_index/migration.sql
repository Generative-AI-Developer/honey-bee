-- Full-text product search. The same immutable function is used by the GIN index and by
-- searchProductIds() in src/server/queries/catalog.ts, so the index is always used.
CREATE OR REPLACE FUNCTION hb_product_search(name text, short_description text, floral_source text, origin text, tags text[])
RETURNS tsvector
LANGUAGE sql
IMMUTABLE PARALLEL SAFE
AS $$
  SELECT setweight(to_tsvector('english', coalesce(name, '')), 'A')
      || setweight(to_tsvector('english', coalesce(floral_source, '') || ' ' || coalesce(array_to_string(tags, ' '), '')), 'B')
      || setweight(to_tsvector('english', coalesce(short_description, '') || ' ' || coalesce(origin, '')), 'C')
$$;

CREATE INDEX "Product_search_idx" ON "Product"
  USING GIN (hb_product_search(name, "shortDescription", "floralSource", origin, tags));
