-- Migrates legacy SW_force_power_tree columns (ability_* / *_links / *_cost)
-- into the new JSON schema columns: tree_nodes and tree_links.
--
-- Safe to run multiple times. It keeps legacy columns in place and only rewrites
-- tree_nodes/tree_links from current legacy column values.

begin;

alter table "SW_force_power_tree"
  add column if not exists "tree_nodes" jsonb not null default '[]'::jsonb,
  add column if not exists "tree_links" jsonb not null default '[]'::jsonb;

do $$
declare
  rec record;
  row_data jsonb;
  nodes jsonb;
  links jsonb;
  seen_link_keys text[];

  r int;
  c int;
  span int;

  current_ability text;
  next_ability text;
  target_ability text;

  cost_text text;
  cost_value int;

  link_text text;
  link_parts text[];
  dir text;

  to_r int;
  to_c int;
  link_key text;
begin
  for rec in
    select *
    from "SW_force_power_tree"
  loop
    row_data := to_jsonb(rec);
    nodes := '[]'::jsonb;
    links := '[]'::jsonb;
    seen_link_keys := array[]::text[];

    -- Top node (always row 1, col 1 in legacy format)
    current_ability := row_data ->> 'ability_1_1';
    if current_ability is not null and btrim(current_ability) <> '' then
      cost_text := row_data ->> 'ability_1_1_cost';
      if cost_text ~ '^-?\d+$' then
        cost_value := cost_text::int;
      else
        cost_value := 0;
      end if;

      nodes := nodes || jsonb_build_array(
        jsonb_build_object(
          'row', 1,
          'col', 1,
          'talent_id', current_ability::int,
          'cost', cost_value,
          'col_span', 4
        )
      );
    end if;

    -- Grid nodes (rows 2..5, cols 1..4), collapsing horizontal duplicates into col_span.
    for r in 2..5 loop
      c := 1;
      while c <= 4 loop
        current_ability := row_data ->> format('ability_%s_%s', r, c);

        if current_ability is null or btrim(current_ability) = '' then
          c := c + 1;
          continue;
        end if;

        span := 1;
        while (c + span) <= 4 loop
          next_ability := row_data ->> format('ability_%s_%s', r, c + span);
          exit when next_ability is null or btrim(next_ability) = '';
          exit when next_ability <> current_ability;
          span := span + 1;
        end loop;

        cost_text := row_data ->> format('ability_%s_%s_cost', r, c);
        if cost_text ~ '^-?\d+$' then
          cost_value := cost_text::int;
        else
          cost_value := 0;
        end if;

        nodes := nodes || jsonb_build_array(
          jsonb_build_object(
            'row', r,
            'col', c,
            'talent_id', current_ability::int,
            'cost', cost_value,
            'col_span', span
          )
        );

        c := c + span;
      end loop;
    end loop;

    -- Helper: top links are legacy ability_1_1_links..ability_1_4_links containing "Down".
    for c in 1..4 loop
      link_text := coalesce(row_data ->> format('ability_1_%s_links', c), '');
      if position('Down' in link_text) > 0 then
        target_ability := row_data ->> format('ability_2_%s', c);
        if target_ability is not null and btrim(target_ability) <> '' then
          link_key := format('1_1_2_%s', c);
          if not (link_key = any(seen_link_keys)) then
            seen_link_keys := array_append(seen_link_keys, link_key);
            links := links || jsonb_build_array(
              jsonb_build_object(
                'from_row', 1,
                'from_col', 1,
                'to_row', 2,
                'to_col', c
              )
            );
          end if;
        end if;
      end if;
    end loop;

    -- Grid links from legacy per-cell direction strings.
    for r in 2..5 loop
      for c in 1..4 loop
        current_ability := row_data ->> format('ability_%s_%s', r, c);
        if current_ability is null or btrim(current_ability) = '' then
          continue;
        end if;

        link_text := coalesce(row_data ->> format('ability_%s_%s_links', r, c), '');
        if btrim(link_text) = '' then
          continue;
        end if;

        link_parts := regexp_split_to_array(link_text, '\s*,\s*');

        foreach dir in array link_parts loop
          to_r := r;
          to_c := c;

          if dir = 'Up' then
            to_r := r - 1;
          elsif dir = 'Down' then
            to_r := r + 1;
          elsif dir = 'Left' then
            to_c := c - 1;
          elsif dir = 'Right' then
            to_c := c + 1;
          else
            continue;
          end if;

          if to_r < 1 or to_r > 5 or to_c < 1 or to_c > 4 then
            continue;
          end if;

          if to_r = 1 then
            -- Top row only has node at (1,1). Directional links to top are represented
            -- as (1,1) -> (2,col), so skip reverse grid->top duplicates here.
            continue;
          end if;

          target_ability := row_data ->> format('ability_%s_%s', to_r, to_c);
          if target_ability is null or btrim(target_ability) = '' then
            continue;
          end if;

          link_key := format('%s_%s_%s_%s', r, c, to_r, to_c);
          if not (link_key = any(seen_link_keys)) then
            seen_link_keys := array_append(seen_link_keys, link_key);
            links := links || jsonb_build_array(
              jsonb_build_object(
                'from_row', r,
                'from_col', c,
                'to_row', to_r,
                'to_col', to_c
              )
            );
          end if;
        end loop;
      end loop;
    end loop;

    update "SW_force_power_tree"
    set
      "tree_nodes" = nodes,
      "tree_links" = links
    where id = rec.id;
  end loop;
end $$;

commit;

-- Optional validation query after migration:
-- select id, "PowerTreeName", jsonb_array_length(tree_nodes) as node_count, jsonb_array_length(tree_links) as link_count
-- from "SW_force_power_tree"
-- order by "PowerTreeName";
