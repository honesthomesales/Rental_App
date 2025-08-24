# Product Requirements Document (PRD)
## Project: Small_Business_Assistant
**Date:** 2025‑07‑18  
**Owner:** Billy Rochester

## Overview
The **Small_Business_Assistant** is a simple, voice‑driven assistant app designed for **manual laborers and small business owners** such as plumbers, HVAC technicians, and electricians.  
It minimizes interaction complexity and allows users to focus on their work while automatically handling:  
✅ Job tracking  
✅ Voice‑driven quotes  
✅ Invoicing  
✅ Before/after photos  
✅ Time tracking via geolocation  

It is deployed as:
- A **mobile app (iOS & Android)** for field workers.
- A **web dashboard** for overview and management.

## Goals
- Make job tracking and invoicing effortless.
- Avoid distracting the user — prioritize **voice commands and minimal screens.**
- Automatically track job time and photos without manual input.
- Support both mobile and desktop users.

## Target Users
- Manual labor professionals who don’t want to fiddle with apps.
- Age 25–65, mostly non‑technical users.
- Primary use in the field while on jobs.

## Features

### Job Creation
- Triggered by voice command.
- User speaks job name and address.
- App records job as active when user arrives at address (GPS check‑in).

### Quote Generation
- Voice‑driven high‑level quote.
- User speaks basic details and materials.
- App formats quote and saves to job record.

### Invoicing
- On job completion, user gives voice command to generate invoice.
- Invoice includes time worked (from GPS), materials, and before/after photos.

### Photos
- User can snap and attach before & after photos to job record.
- Shown on both mobile and web dashboard.

### Time Tracking
- GPS detects arrival at address and starts timer.
- Timer stops on leaving.

## Platforms
- Mobile app (iOS and Android): primary user interaction, voice‑first.
- Web dashboard: secondary, for review and administration.

## Technical Notes
- Backend: REST/GraphQL API, cloud‑hosted database.
- Mobile: React Native or Flutter recommended.
- Voice recognition: platform‑native (Siri/Google) or 3rd‑party ASR.
- Geolocation: platform SDKs with privacy prompts.