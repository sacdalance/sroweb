-- Migration: Add outside visitors flag
-- Date: 2026-04-10
-- Description: Add boolean column to track if activity expects visitors from outside UP Baguio

ALTER TABLE activity ADD COLUMN IF NOT EXISTS has_outside_visitors BOOLEAN DEFAULT false;
