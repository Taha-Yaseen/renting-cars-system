-- Optional sample data (run after 001_initial_schema.sql)

insert into public.cars (make, model, year, license_plate, daily_rate, status, purchase_month, purchase_year, color, mechanic_fee_due_date, oil_change_due_km) values
  ('Toyota', 'Camry', 2023, 'ABC-1234', 55, 'Available', 3, 2023, 'white', '2026-08-15', 85000),
  ('Honda', 'CR-V', 2022, 'XYZ-5678', 72, 'Rented', 6, 2022, 'black', '2026-04-01', 62000),
  ('Ford', 'Mustang', 2024, 'DEF-9012', 95, 'Available', 1, 2024, 'red', '2026-12-01', 15000),
  ('BMW', '3 Series', 2023, 'GHI-3456', 110, 'Maintenance', 9, 2023, 'silver', '2026-03-01', 45000),
  ('Tesla', 'Model 3', 2024, 'JKL-7890', 88, 'Rented', 11, 2023, 'blue', '2026-09-30', 22000);

insert into public.clients (full_name, phone, status) values
  ('Sarah Johnson', '(555) 123-4567', 'Active'),
  ('Michael Chen', '(555) 234-5678', 'Active'),
  ('Emily Rodriguez', '(555) 345-6789', 'Suspended'),
  ('James Wilson', '(555) 456-7890', 'Active');

-- Rentals reference cars/clients by license plate and phone (adjust if you changed seed data)
insert into public.rentals (car_id, client_id, start_date, end_date, total_cost, daily_rate, status)
select c.id, cl.id, '2025-05-01', '2025-05-10', 648, 72, 'Active'
from public.cars c, public.clients cl
where c.license_plate = 'XYZ-5678' and cl.phone = '(555) 123-4567';

insert into public.rentals (car_id, client_id, start_date, end_date, total_cost, daily_rate, status)
select c.id, cl.id, '2025-04-20', '2025-05-05', 1320, 88, 'Overdue'
from public.cars c, public.clients cl
where c.license_plate = 'JKL-7890' and cl.phone = '(555) 234-5678';
