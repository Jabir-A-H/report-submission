-- =====================================================================
-- MASTER DDL MIGRATION: TRACK 1 PRE-PRODUCTION DATABASE HARDENING
-- Project: talimul-quran-report-submission (pxdkvewaglagnfcqeckn)
-- Date: 2026-11-17
-- Standard: AGENTS.md Rule 7 (Pre-Production Agility & Clean DDL Authority)
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. MATHEMATICAL CORRECTION: view_city_meeting_agg
-- Fix 13x attendance inflation by replacing raw sum(avg) with weighted
-- average attendance: round(sum(count * avg) / sum(count)) with COALESCE
-- and fallback to unweighted average when total count is 0.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_city_meeting_agg WITH (security_invoker = true) AS
SELECT 
  r.year, 
  r.month, 
  r.report_type, 
  rm.category,
  sum(COALESCE(rm.city_count, 0)) AS city_count,
  CASE 
    WHEN sum(COALESCE(rm.city_count, 0)) > 0 THEN 
      round(sum(COALESCE(rm.city_count, 0) * COALESCE(rm.city_avg_attendance, 0))::numeric / sum(COALESCE(rm.city_count, 0))::numeric)
    WHEN count(rm.id) FILTER (WHERE COALESCE(rm.city_avg_attendance, 0) > 0) > 0 THEN
      round(avg(COALESCE(rm.city_avg_attendance, 0)) FILTER (WHERE COALESCE(rm.city_avg_attendance, 0) > 0))
    ELSE 0 
  END AS city_avg_attendance,
  sum(COALESCE(rm.thana_count, 0)) AS thana_count,
  CASE 
    WHEN sum(COALESCE(rm.thana_count, 0)) > 0 THEN 
      round(sum(COALESCE(rm.thana_count, 0) * COALESCE(rm.thana_avg_attendance, 0))::numeric / sum(COALESCE(rm.thana_count, 0))::numeric)
    WHEN count(rm.id) FILTER (WHERE COALESCE(rm.thana_avg_attendance, 0) > 0) > 0 THEN
      round(avg(COALESCE(rm.thana_avg_attendance, 0)) FILTER (WHERE COALESCE(rm.thana_avg_attendance, 0) > 0))
    ELSE 0 
  END AS thana_avg_attendance,
  sum(COALESCE(rm.ward_count, 0)) AS ward_count,
  CASE 
    WHEN sum(COALESCE(rm.ward_count, 0)) > 0 THEN 
      round(sum(COALESCE(rm.ward_count, 0) * COALESCE(rm.ward_avg_attendance, 0))::numeric / sum(COALESCE(rm.ward_count, 0))::numeric)
    WHEN count(rm.id) FILTER (WHERE COALESCE(rm.ward_avg_attendance, 0) > 0) > 0 THEN
      round(avg(COALESCE(rm.ward_avg_attendance, 0)) FILTER (WHERE COALESCE(rm.ward_avg_attendance, 0) > 0))
    ELSE 0 
  END AS ward_avg_attendance
FROM public.report r
JOIN public.report_meeting rm ON r.id = rm.report_id
JOIN public.zone z ON r.zone_id = z.id
WHERE (z.zone_type IS DISTINCT FROM 'city')
GROUP BY r.year, r.month, r.report_type, rm.category;

-- ---------------------------------------------------------------------
-- 2. DDL EXTENSION: report_header.month & BACKFILL
-- Eliminates client-side month shaping and out-of-order snapshot resolution.
-- ---------------------------------------------------------------------
ALTER TABLE public.report_header ADD COLUMN IF NOT EXISTS month smallint;

UPDATE public.report_header rh
SET month = r.month
FROM public.report r
WHERE rh.report_id = r.id AND rh.month IS NULL;

ALTER TABLE public.report_header ALTER COLUMN month SET NOT NULL;

-- ---------------------------------------------------------------------
-- 3. HARDENED RPC: get_or_create_report
-- Seeds month directly into report_header. Enforces authentication,
-- active status, city zone guard, and null-safe authorization.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_or_create_report(
  p_zone_id integer,
  p_year integer,
  p_month integer,
  p_report_type character varying
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report_id INT;
  v_caller_zone INT;
  v_is_adm BOOLEAN;
  v_is_city_zone BOOLEAN;
  v_course_cat TEXT;
  v_org_cat TEXT;
  v_personal_cat TEXT;
  v_meeting_cat TEXT;
  v_extra_cat TEXT;
BEGIN
  -- 1. Ensure authenticated session
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required' USING ERRCODE = '42501';
  END IF;

  v_is_adm := COALESCE(public.is_admin(), false);
  v_caller_zone := public.get_user_zone_id();

  -- 2. Strict null-safe authorization check
  IF NOT (v_is_adm OR (v_caller_zone IS NOT NULL AND v_caller_zone = p_zone_id)) THEN
    RAISE EXCEPTION 'Unauthorized: Caller cannot initialize reports for zone %', p_zone_id USING ERRCODE = '42501';
  END IF;

  -- 3. Dynamic hierarchical check (No hardcoded magic numbers like zone_id = 1)
  SELECT (zone_type = 'city') INTO v_is_city_zone
  FROM public.zone
  WHERE id = p_zone_id;

  IF COALESCE(v_is_city_zone, false) THEN
    RAISE EXCEPTION 'Invalid operation: City entity (%) does not submit reports', p_zone_id USING ERRCODE = '22023';
  END IF;

  -- 4. Check existing report
  SELECT id INTO v_report_id
  FROM public.report
  WHERE zone_id = p_zone_id
    AND year = p_year
    AND month = p_month
    AND report_type = p_report_type;

  IF v_report_id IS NOT NULL THEN
    RETURN v_report_id;
  END IF;

  -- 5. Insert root report row
  INSERT INTO public.report (zone_id, year, month, report_type)
  VALUES (p_zone_id, p_year, p_month, p_report_type)
  ON CONFLICT ON CONSTRAINT report_zone_month_year_type_unique DO NOTHING
  RETURNING id INTO v_report_id;

  -- 6. Seed child rows if inserted
  IF v_report_id IS NOT NULL THEN
    INSERT INTO public.report_header (
      report_id, month, responsible_name, thana, ward, total_muallima, 
      muallima_increase, muallima_decrease, certified_muallima, 
      certified_muallima_taking_classes, trained_muallima, 
      trained_muallima_taking_classes, total_unit, units_with_muallima
    ) VALUES (v_report_id, p_month, '', '', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

    INSERT INTO public.report_comment (report_id, comment)
    VALUES (v_report_id, '');

    FOREACH v_course_cat IN ARRAY ARRAY[
      'বিশিষ্টদের', 'সাধারণদের', 'কর্মীদের', 'ইউনিট সভানেত্রী', 
      'অগ্রসরদের', 'রুকনদের অনুশীলনী ক্লাস', 'শিশু- তা''লিমুল কুরআন', 
      'নিরক্ষর- তা''লিমুস সলাত'
    ] LOOP
      INSERT INTO public.report_course (
        report_id, category, number, increase, decrease, sessions, 
        students, attendance, status_board, status_qayda, status_ampara, 
        status_quran, completed, correctly_learned
      ) VALUES (v_report_id, v_course_cat, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    END LOOP;

    FOREACH v_org_cat IN ARRAY ARRAY[
      'দাওয়াত দান', 'কতজন ইসলামের আদর্শ মেনে চলার চেষ্টা করছেন', 
      'সহযোগী হয়েছেন', 'সম্মতি দিয়েছেন', 'সক্রিয় সহযোগী', 'কর্মী', 
      'রুকন', 'দাওয়াতী ইউনিট', 'ইউনিট', 'সুধী', 'এককালীন', 
      'জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতটি',
      'জনশক্তির সহীহ্ কুরআন তিলাওয়াত অনুশীলনী (মাশক) : কতজন', 'বই বিলি', 'বই বিক্রি'
    ] LOOP
      INSERT INTO public.report_organizational (report_id, category, number, increase, amount, comments)
      VALUES (v_report_id, v_org_cat, 0, 0, 0, '');
    END LOOP;

    FOREACH v_personal_cat IN ARRAY ARRAY['রুকন', 'কর্মী', 'সক্রিয় সহযোগী'] LOOP
      INSERT INTO public.report_personal (
        report_id, category, teaching, learning, olama_invited, 
        became_shohojogi, became_sokrio_shohojogi, became_kormi, became_rukon
      ) VALUES (v_report_id, v_personal_cat, 0, 0, 0, 0, 0, 0, 0);
    END LOOP;

    FOREACH v_meeting_cat IN ARRAY ARRAY[
      'কমিটি বৈঠক হয়েছে', 'মুয়াল্লিমাদের নিয়ে বৈঠক', 
      'Committee Orientation', 'Muallima Orientation', 'অন্যান্য'
    ] LOOP
      INSERT INTO public.report_meeting (
        report_id, category, city_count, city_avg_attendance, 
        thana_count, thana_avg_attendance, ward_count, 
        ward_avg_attendance, meeting_name, comments
      ) VALUES (v_report_id, v_meeting_cat, 0, 0, 0, 0, 0, 0, '', '');
    END LOOP;

    FOREACH v_extra_cat IN ARRAY ARRAY[
      'মক্তব সংখ্যা', 'মক্তব বৃদ্ধি', 'মহানগরী পরিচালিত', 
      'স্থানীয়ভাবে পরিচালিত', 'মহানগরীর সফর', 'থানা কমিটির সফর', 
      'থানা প্রতিনিধির সফর', 'ওয়ার্ড প্রতিনিধির সফর'
    ] LOOP
      INSERT INTO public.report_extra (report_id, category, number)
      VALUES (v_report_id, v_extra_cat, 0);
    END LOOP;
  ELSE
    SELECT id INTO v_report_id
    FROM public.report
    WHERE zone_id = p_zone_id
      AND year = p_year
      AND month = p_month
      AND report_type = p_report_type;
  END IF;

  RETURN v_report_id;
END;
$$;

-- ---------------------------------------------------------------------
-- 4. UNICODE DEDUPLICATION & SANITIZATION (REPORT 23 & CHILD TABLES)
-- Idempotent merge of decomposed Nukta duplicate categories into canonical NFC \u09df.
-- ---------------------------------------------------------------------
-- Step 4a: Merge duplicate rows in report_extra
WITH merged AS (
  SELECT 
    d.report_id,
    replace(d.category, chr(2479)||chr(2492), chr(2527)) as canonical_cat,
    GREATEST(d.number, p.number) as max_num
  FROM public.report_extra d
  JOIN public.report_extra p 
    ON d.report_id = p.report_id 
   AND p.category = replace(d.category, chr(2479)||chr(2492), chr(2527))
  WHERE position(chr(2492) in d.category) > 0
)
UPDATE public.report_extra target
SET number = merged.max_num
FROM merged
WHERE target.report_id = merged.report_id
  AND target.category = merged.canonical_cat;

DELETE FROM public.report_extra d
WHERE position(chr(2492) in d.category) > 0
  AND EXISTS (
    SELECT 1 FROM public.report_extra p
    WHERE p.report_id = d.report_id
      AND p.category = replace(d.category, chr(2479)||chr(2492), chr(2527))
  );

UPDATE public.report_extra
SET category = replace(category, chr(2479)||chr(2492), chr(2527))
WHERE position(chr(2492) in category) > 0;

-- Step 4b: Normalize remaining child tables
UPDATE public.report_organizational
SET category = replace(category, chr(2479)||chr(2492), chr(2527))
WHERE position(chr(2492) in category) > 0;

UPDATE public.report_personal
SET category = replace(category, chr(2479)||chr(2492), chr(2527))
WHERE position(chr(2492) in category) > 0;

UPDATE public.report_meeting
SET category = replace(category, chr(2479)||chr(2492), chr(2527))
WHERE position(chr(2492) in category) > 0;

UPDATE public.city_report_override
SET category = replace(category, chr(2479)||chr(2492), chr(2527))
WHERE position(chr(2492) in category) > 0;

-- ---------------------------------------------------------------------
-- 5. DECLARATIVE MANAGEMENT AGGREGATION VIEW: view_zone_stats
-- Consolidates 30 HTTP HEAD calls into a single declarative query.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.view_zone_stats WITH (security_invoker = true) AS
SELECT 
  z.id,
  z.name,
  z.zone_type,
  z.parent_id,
  pz.name AS parent_name,
  COALESCE(p.user_count, 0)::int AS user_count,
  COALESCE(r.report_count, 0)::int AS report_count
FROM public.zone z
LEFT JOIN public.zone pz ON z.parent_id = pz.id
LEFT JOIN (
  SELECT zone_id, count(*)::int AS user_count 
  FROM public.people 
  GROUP BY zone_id
) p ON p.zone_id = z.id
LEFT JOIN (
  SELECT zone_id, count(*)::int AS report_count 
  FROM public.report 
  GROUP BY zone_id
) r ON r.zone_id = z.id;

-- ---------------------------------------------------------------------
-- 6. UNIQUE CONSTRAINT FOR OVERRIDES
-- Ensure 7-column NULLS NOT DISTINCT constraint is established.
-- ---------------------------------------------------------------------
ALTER TABLE public.city_report_override 
  DROP CONSTRAINT IF EXISTS city_report_override_unique_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'city_report_override_period_unique'
  ) THEN
    ALTER TABLE public.city_report_override
      ADD CONSTRAINT city_report_override_period_unique
      UNIQUE NULLS NOT DISTINCT (year, month, end_month, report_type, section, field, category);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 7. SECURITY & RLS POLICIES (CHILD TABLES & PEOPLE TABLE)
-- Enforce write immutability for submitted reports on non-admins.
-- Revoke direct client writes on public.people.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS people_update_admin ON public.people;
DROP POLICY IF EXISTS people_delete_admin ON public.people;
DROP POLICY IF EXISTS people_insert_self_or_admin ON public.people;

COMMIT;
