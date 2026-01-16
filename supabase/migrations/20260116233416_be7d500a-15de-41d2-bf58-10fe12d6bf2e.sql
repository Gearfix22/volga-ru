
-- Add duration and availability fields to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS availability_days integer[] DEFAULT ARRAY[0,1,2,3,4,5,6],
ADD COLUMN IF NOT EXISTS available_from time DEFAULT '08:00:00',
ADD COLUMN IF NOT EXISTS available_to time DEFAULT '20:00:00';

-- Add comments for documentation
COMMENT ON COLUMN public.services.duration_minutes IS 'Service duration in minutes (e.g., 60 = 1 hour)';
COMMENT ON COLUMN public.services.availability_days IS 'Days of week available (0=Sunday, 1=Monday, etc.)';
COMMENT ON COLUMN public.services.available_from IS 'Service available from time';
COMMENT ON COLUMN public.services.available_to IS 'Service available until time';

-- Populate AR/RU translations for existing services
UPDATE public.services SET
  name_ar = 'خدمة السائق',
  name_ru = 'Услуга водителя',
  description_ar = 'سائق محترف للجولات السياحية، النقل من المطار، والسفر بين المدن. يشمل سيارات مريحة وسائقين ذوي خبرة.',
  description_ru = 'Профессиональный водитель для городских туров, трансферов из аэропорта и междугородних поездок. Включает комфортные автомобили и опытных водителей.'
WHERE name = 'Driver Service';

UPDATE public.services SET
  name_ar = 'حجز الإقامة',
  name_ru = 'Бронирование жилья',
  description_ar = 'حجوزات الفنادق والشقق والإقامة. قدم متطلباتك واحصل على عرض سعر مخصص من المسؤول.',
  description_ru = 'Бронирование отелей, апартаментов и жилья. Отправьте свои требования и получите индивидуальное предложение от администратора.'
WHERE name = 'Accommodation Booking';

UPDATE public.services SET
  name_ar = 'الأنشطة والفعاليات',
  name_ru = 'Мероприятия и события',
  description_ar = 'تذاكر وتجارب للمعالم السياحية والعروض والترفيه. السيرك والمتاحف وجولات المدينة والمزيد.',
  description_ru = 'Билеты и впечатления на достопримечательности, шоу и развлечения. Цирк, музеи, городские экскурсии и многое другое.'
WHERE name = 'Activities & Events';

UPDATE public.services SET
  name_ar = 'مرشد سياحي خاص',
  name_ru = 'Частный гид',
  description_ar = 'خدمات مرشد سياحي محترف مع خبرة محلية',
  description_ru = 'Профессиональные услуги гида с местной экспертизой'
WHERE name = 'Private Tourist Guide';
