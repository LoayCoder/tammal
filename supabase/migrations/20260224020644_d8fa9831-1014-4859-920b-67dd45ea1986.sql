ALTER TABLE question_schedules DROP CONSTRAINT question_schedules_questions_per_delivery_check;
ALTER TABLE question_schedules ADD CONSTRAINT question_schedules_questions_per_delivery_check
  CHECK (questions_per_delivery >= 0 AND questions_per_delivery <= 5);