

## Plan: Generate Bilingual TAMMAL Application Profile PDF

### Overview
Create a professional, bilingual (English + Arabic) PDF document that profiles the TAMMAL platform for customers. The document will use ReportLab to generate a polished, enterprise-grade PDF with structured sections.

### Document Structure (14-16 pages)

1. **Cover Page** — TAMMAL branding, tagline in EN/AR, "Enterprise Employee Wellbeing Platform"
2. **Table of Contents** — Bilingual section listing
3. **Executive Overview** — What is TAMMAL, target market, core value proposition (EN + AR)
4. **Key Features Overview** — Visual grid of 10 feature domains with icons/descriptions
5. **Feature Deep-Dive Pages** (6-7 pages):
   - Employee Engagement & Daily Check-in
   - Mental Wellness Toolkit (8 tools)
   - Spiritual Wellness (MENA-specific)
   - Task & Workload Intelligence (AI-powered)
   - Recognition & Awards (Fairness Engine)
   - Crisis Support
   - Organization Administration & Analytics
6. **Screenshots Section** — Login screen with caption + placeholder descriptions for key screens
7. **Step-by-Step User Guide** — How employees, managers, and admins use the platform
8. **Business Value & Benefits** — ROI outcomes, impact metrics, competitive advantages
9. **Technical Highlights** — Security, multi-tenant, PWA, bilingual, AI architecture
10. **Contact / Getting Started** — Call to action

### Technical Approach

- **Tool**: Python + ReportLab (already available in sandbox)
- **Design**: Dark navy header bars, teal accent color (matching TAMMAL brand), clean typography
- **Bilingual**: Each section has English followed by Arabic text
- **Screenshot**: Embed the captured login page screenshot
- **Output**: `/mnt/documents/TAMMAL_Application_Profile.pdf`
- **QA**: Convert to images, inspect every page

### Files
- Script: `/tmp/generate_tammal_profile.py` (one-off script)
- Output: `/mnt/documents/TAMMAL_Application_Profile.pdf`

No codebase changes required — this is a standalone document generation task.

