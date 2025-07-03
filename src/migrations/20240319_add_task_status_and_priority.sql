-- Add status and priority fields to web_tasks table
ALTER TABLE web_tasks
ADD COLUMN status text CHECK (status IN ('todo', 'doing', 'done')) DEFAULT 'todo',
ADD COLUMN priority text CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium'; 