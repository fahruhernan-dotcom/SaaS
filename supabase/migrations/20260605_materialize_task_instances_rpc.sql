begin;

create or replace function public.materialize_peternak_task_instances(
  p_tenant_id uuid,
  p_start_date date,
  p_end_date date,
  p_livestock_type text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_template record;
  v_curr_date date;
  v_should_create boolean;
  v_assigned_worker_id uuid;
  v_assigned_profile_id uuid;
begin
  -- Required args
  if p_tenant_id is null or p_start_date is null or p_end_date is null then
    raise exception 'Invalid Arguments: tenant_id, start_date, and end_date are required';
  end if;

  -- Auth required
  if auth.uid() is null then
    raise exception 'Access Denied: Authentication required';
  end if;

  -- Caller must belong to tenant, except superadmin
  if not (
    public.is_tenant_member(p_tenant_id)
    or public.is_superadmin()
  ) then
    raise exception 'Access Denied: You are not a member of this tenant';
  end if;

  -- Date validation
  if p_start_date > p_end_date then
    raise exception 'Invalid Date Range: Start date must be before or equal to end date';
  end if;

  if (p_end_date - p_start_date) > 45 then
    raise exception 'Invalid Date Range: Maximum allowed range is 45 days';
  end if;

  -- Loop active templates for this tenant/vertical only
  for v_template in
    select *
    from public.peternak_task_templates
    where tenant_id = p_tenant_id
      and is_active = true
      and is_deleted = false
      and start_date <= p_end_date
      and (end_date is null or end_date >= p_start_date)
      and (
        p_livestock_type is null
        or livestock_type = p_livestock_type
      )
  loop
    v_curr_date := greatest(p_start_date, v_template.start_date);

    while v_curr_date <= least(p_end_date, coalesce(v_template.end_date, p_end_date)) loop
      v_should_create := false;

      -- Recurrence rules
      case v_template.recurring_type
        when 'harian' then
          v_should_create := true;

        when 'mingguan' then
          if v_template.recurring_days_of_week is not null
             and extract(isodow from v_curr_date)::int = any(v_template.recurring_days_of_week) then
            v_should_create := true;
          end if;

        when 'dua_mingguan' then
          if ((v_curr_date - v_template.start_date) % 14) = 0 then
            v_should_create := true;
          end if;

        when 'bulanan' then
          if extract(day from v_curr_date)::int = extract(day from v_template.start_date)::int then
            v_should_create := true;
          end if;

        when 'custom' then
          if ((v_curr_date - v_template.start_date) % greatest(coalesce(v_template.recurring_interval_days, 1), 1)) = 0 then
            v_should_create := true;
          end if;

        when 'sekali' then
          if v_curr_date = v_template.start_date then
            v_should_create := true;
          end if;

        else
          v_should_create := false;
      end case;

      if v_should_create then
        -- Idempotency: skip if active instance already exists for template/date
        if not exists (
          select 1
          from public.peternak_task_instances i
          where i.tenant_id = p_tenant_id
            and i.template_id = v_template.id
            and i.due_date = v_curr_date
            and i.is_deleted = false
        ) then
          v_assigned_worker_id := null;
          v_assigned_profile_id := null;

          -- Preferred assignment: template default worker
          if v_template.default_assignee_worker_id is not null then
            select
              w.id,
              w.profile_id
            into
              v_assigned_worker_id,
              v_assigned_profile_id
            from public.kandang_workers w
            where w.id = v_template.default_assignee_worker_id
              and w.tenant_id = p_tenant_id
              and w.is_deleted is not true
              and coalesce(w.status, 'aktif') in ('aktif', 'active')
            limit 1;
          end if;

          -- Fallback assignment:
          -- If template has no default worker, assign to an active linked kandang worker
          -- so staff daily task page can see the task.
          if v_assigned_profile_id is null then
            select
              w.id,
              w.profile_id
            into
              v_assigned_worker_id,
              v_assigned_profile_id
            from public.kandang_workers w
            where w.tenant_id = p_tenant_id
              and w.profile_id is not null
              and w.is_deleted is not true
              and coalesce(w.status, 'aktif') in ('aktif', 'active')
            order by w.created_at asc
            limit 1;
          end if;

          -- Final fallback: active staff profile in this tenant
          if v_assigned_profile_id is null then
            select p.id
            into v_assigned_profile_id
            from public.profiles p
            where p.tenant_id = p_tenant_id
              and p.is_active = true
              and p.role = 'staff'
            order by p.created_at asc
            limit 1;
          end if;

          insert into public.peternak_task_instances (
            tenant_id,
            template_id,
            kandang_name,
            title,
            description,
            task_type,
            due_date,
            due_time,
            assigned_worker_id,
            assigned_profile_id,
            status,
            is_deleted,
            livestock_type
          )
          values (
            p_tenant_id,
            v_template.id,
            v_template.kandang_name,
            v_template.title,
            v_template.description,
            v_template.task_type,
            v_curr_date,
            v_template.due_time,
            v_assigned_worker_id,
            v_assigned_profile_id,
            'pending',
            false,
            v_template.livestock_type
          );
        end if;
      end if;

      v_curr_date := v_curr_date + 1;
    end loop;
  end loop;
end;
$function$;

revoke all on function public.materialize_peternak_task_instances(uuid, date, date, text) from public;
revoke all on function public.materialize_peternak_task_instances(uuid, date, date, text) from anon;
grant execute on function public.materialize_peternak_task_instances(uuid, date, date, text) to authenticated;

commit;
