-- Add objective and delivery_type fields to creative_briefs
ALTER TABLE public.creative_briefs 
ADD COLUMN IF NOT EXISTS objective TEXT,
ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'video';

-- Add comment for documentation
COMMENT ON COLUMN public.creative_briefs.objective IS 'Content objective: conversion, branding, engagement, etc.';
COMMENT ON COLUMN public.creative_briefs.delivery_type IS 'Delivery type: video, reels, campaign, institutional, etc.';