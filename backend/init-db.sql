-- Database initialization script for ThermoLabel
-- This file is used when running with Docker

-- Create tables
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR NOT NULL PRIMARY KEY,
    name VARCHAR DEFAULT 'Unnamed project',
    description VARCHAR,
    image_width INTEGER DEFAULT 0,
    image_height INTEGER DEFAULT 0,
    palette VARCHAR,
    image_data BYTEA,
    annotations_data JSON DEFAULT '[]'::json,
    classes_data JSON DEFAULT '[]'::json,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR NOT NULL PRIMARY KEY,
    value JSON DEFAULT '[]'::json
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Add comment
COMMENT ON TABLE projects IS 'Thermal image projects with annotations';
COMMENT ON TABLE app_settings IS 'Application settings storage';
