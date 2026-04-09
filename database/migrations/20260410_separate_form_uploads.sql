-- Migration: Separate form uploads (concept paper + form 2b)
-- Date: 2026-04-10
-- Description: Replace single drive_folder_link with separate concept_paper_link and form_2b_link columns

-- Add new columns
ALTER TABLE activity ADD COLUMN IF NOT EXISTS concept_paper_link TEXT;
ALTER TABLE activity ADD COLUMN IF NOT EXISTS form_2b_link TEXT;

-- Migrate existing data: old drive_folder_link -> concept_paper_link
UPDATE activity SET concept_paper_link = drive_folder_link WHERE drive_folder_link IS NOT NULL AND drive_folder_link != 'N/A';
