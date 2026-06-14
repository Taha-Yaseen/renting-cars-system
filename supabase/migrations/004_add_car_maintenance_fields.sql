-- Add color, mechanic fee due date, and oil change due km to cars

alter table public.cars
  add column if not exists color text check (color in (
    'white', 'black', 'silver', 'gray', 'red', 'blue', 'navy', 'green',
    'brown', 'beige', 'gold', 'orange', 'yellow', 'burgundy', 'purple'
  )),
  add column if not exists mechanic_fee_due_date date,
  add column if not exists oil_change_due_km integer check (oil_change_due_km > 0);
