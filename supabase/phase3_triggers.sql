-- =========================================================
-- Phase 3 additions — notification triggers
-- Run this in the Supabase SQL editor AFTER schema.sql.
-- =========================================================

-- Notify the *other* participant whenever a new message is sent.
create or replace function notify_on_new_message()
returns trigger as $$
declare
  recipient uuid;
  sender_name text;
begin
  select
    case when c.participant_one = new.sender_id then c.participant_two
         else c.participant_one end
  into recipient
  from conversations c
  where c.id = new.conversation_id;

  select full_name into sender_name from profiles where id = new.sender_id;

  insert into notifications (user_id, title, body, link)
  values (
    recipient,
    coalesce(sender_name, 'New message'),
    left(new.body, 120),
    '/messages/' || new.conversation_id
  );

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_new_message
  after insert on messages
  for each row execute function notify_on_new_message();

-- Notify the buyer whenever their order's status changes.
create or replace function notify_on_order_status_change()
returns trigger as $$
begin
  if new.status is distinct from old.status then
    insert into notifications (user_id, title, body, link)
    values (
      new.buyer_id,
      'Order update',
      'Your order is now ' || replace(new.status::text, '_', ' '),
      '/orders/' || new.id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_order_status
  after update on orders
  for each row execute function notify_on_order_status_change();

-- Notify a service provider whenever someone requests their service.
create or replace function notify_on_service_request()
returns trigger as $$
declare
  provider uuid;
  service_title text;
begin
  select provider_id, title into provider, service_title
  from services where id = new.service_id;

  insert into notifications (user_id, title, body, link)
  values (
    provider,
    'New service request',
    coalesce(service_title, 'Someone requested your service'),
    '/gigs/' || new.service_id
  );

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_service_request
  after insert on service_requests
  for each row execute function notify_on_service_request();

-- =========================================================
-- Realtime — enable it for the tables the UI subscribes to.
-- (Safe to re-run; Supabase ignores duplicates.)
-- =========================================================
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
