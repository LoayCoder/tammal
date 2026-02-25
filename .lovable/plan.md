

# First Aider System Upgrade -- Implementation Plan

## Overview

This plan transforms the existing basic crisis support system into a professional-grade support platform across 6 phases. Given the scope, we'll implement incrementally, with each phase delivering usable value.

---

## Phase 1: Database Schema Upgrades

Add new columns and tables to support smart matching, scheduling, sessions, and secure attachments.

### Migration SQL

**Enhance `mh_first_aiders`** -- add specializations, languages (already exists as column), rating, response time average, calendar integration config, and availability config.

**New table: `mh_support_sessions`** -- tracks scheduled and live sessions between employees and first aiders, including scheduling times, communication channel, session notes, outcome, and data retention policy.

**New table: `mh_secure_attachments`** -- encrypted file metadata with expiry, access logs, watermark text, and storage path in a private bucket.

**New table: `mh_session_ratings`** -- post-session employee feedback (1-5 rating + optional comment).

**New table: `mh_first_aider_availability`** -- daily time-slot availability merged from built-in rules and external calendar busy times.

**Enhance `mh_crisis_cases`** -- add `urgency_level` (1-5), `preferred_contact_method`, `matched_at`, `scheduled_session_id`.

**New storage bucket**: `support-attachments` (private) for secure file uploads.

All tables include `tenant_id`, `deleted_at` (soft delete), and appropriate RLS policies following existing patterns.

---

## Phase 2: Smart Matching Engine

### Edge Function: `match-first-aider`

An AI-powered matching function that scores available first aiders using multiple factors:

```text
Score = (Specialization match x 30%) 
      + (Language match x 20%) 
      + (Current load inverse x 20%) 
      + (Response time history x 15%) 
      + (Rating x 15%)
```

Uses Lovable AI (`google/gemini-3-flash-preview`) to analyze the employee's intent/summary and match against first aider specializations when simple keyword matching is insufficient.

### Hook: `useSmartMatching`

- Replaces the current `auto_assign_crisis_case` RPC for non-urgent cases
- Provides `matchFirstAider(caseId)` mutation
- Returns ranked list of matches with scores for transparency

### UI Updates

- **`CrisisRequestPage.tsx`**: Add urgency selector (1-5 scale with clear labels), preferred contact method (chat/voice/video), and preference fields (language, gender preference)
- Show matched first aider profile with rating, specializations, languages before confirmation

---

## Phase 3: Professional Scheduling System

### New Components

**`FirstAiderAvailabilityManager.tsx`**
- Visual weekly grid editor (drag to set available hours)
- Max daily sessions limit
- Advance booking window configuration (e.g., 2 weeks)
- Minimum notice rules (e.g., 4 hours for non-urgent)
- Emergency override toggle
- External calendar sync status indicator

**`EmployeeBookingWidget.tsx`**
- Visual calendar showing available slots for the matched first aider
- One-click booking with instant confirmation
- Timezone auto-detection using `Intl.DateTimeFormat`
- Buffer time (15 min between sessions) automatically applied
- Reschedule / Cancel with notification to both parties

**`SessionWorkspace.tsx`**
- Unified view for the active session (chat panel + session info)
- Quick-access guidance protocols sidebar
- Secure note-taking area (first aider only)
- One-click escalation tools
- Post-session outcome logging (resolved / escalated / follow-up needed)
- Session timer display

### Calendar Integration (External)

**Edge Function: `calendar-sync`**
- Google Calendar connector via Lovable connector system
- Fetches free/busy data only (privacy-preserving -- no meeting titles)
- Writes booked sessions back as calendar events
- Webhook endpoint for real-time updates

### Hook: `useSessionScheduling`
- `getAvailableSlots(firstAiderId, dateRange)` -- merges built-in availability with external busy times
- `bookSession(firstAiderId, slot)` -- creates session + calendar event
- `rescheduleSession(sessionId, newSlot)` -- updates with notifications
- `cancelSession(sessionId)` -- with reason tracking

---

## Phase 4: Enhanced Communication Platform

### Real-time Chat Upgrade

**Database changes:**
- Enable Supabase Realtime on `mh_crisis_messages` (replace 5s polling)
- Add columns: `message_type` (text/voice_note/image/system), `read_at`, `reactions` (jsonb), `reply_to_id`

**New Components:**

**`EnhancedChatPanel.tsx`**
- Real-time message streaming via Supabase Realtime subscriptions
- Typing indicators (presence channel)
- Read receipts (blue checkmarks)
- Message reactions (emoji picker)
- Reply-to-message threading
- Voice note recording (MediaRecorder API + upload to `support-attachments` bucket)
- Inline image/attachment preview with secure upload
- Auto-scroll with "new messages" indicator
- Message grouping by time

**`VoiceCallPanel.tsx`** (WebRTC)
- Peer-to-peer audio using WebRTC
- Signaling via Supabase Realtime broadcast channel
- STUN servers (free Google STUN)
- Call UI: mute, speaker, end call, duration timer
- Push notification for incoming calls

**`VideoCallPanel.tsx`** (WebRTC)
- Extends voice with video streams
- Camera toggle, background blur (using Canvas API)
- Screen sharing via `getDisplayMedia()`
- Picture-in-picture mode
- Virtual waiting room before join

### Edge Function: `signaling-relay`
- WebRTC offer/answer/ICE candidate exchange
- Session recording consent management
- Call metadata logging (duration, type)

### Push Notifications
- Leverage existing `usePushNotifications` hook
- Add notification types: incoming_call, session_reminder (15 min before), new_message_urgent

---

## Phase 5: Secure Data Sharing

### Storage Setup
- Private `support-attachments` bucket with RLS
- Max file size: 10MB
- Allowed types: images, PDFs, audio (voice notes)

### Edge Function: `secure-upload`
- Server-side upload with metadata recording
- Auto-expiry date calculation (30 days default, configurable)
- Access log entry on every view
- Watermark text generation (viewer identifier)

### New Components

**`SecureAttachmentUploader.tsx`**
- Drag-drop upload with progress bar
- File type validation (client + server)
- Encryption indicator badge
- Auto-expiry countdown display

**`SecureAttachmentViewer.tsx`**
- Browser-only render (no download button)
- Watermarked image display
- Access log viewing (for first aiders/admins)
- "Encrypted - Auto-deleted in X days" indicator
- Revoke access button

---

## Phase 6: Professional Dashboard UI

### Employee Experience

**Upgrade `CrisisRequestPage.tsx`**
- Visual category selector with icons (Physical Injury, Mental Health, Work Safety, Personal Crisis)
- Urgency indicator with clear time expectations per level
- First aider profile cards: photo, rating (stars), languages, specializations, availability status
- "Chat Now" vs "Schedule Later" split action
- Inline secure attachment upload

**New: `MySupportSessions.tsx`**
- Session history with continuity (grouped by case)
- Follow-up scheduling from resolved sessions
- Shared session notes (read-only for employee)
- Resource library access (links shared during sessions)

### First Aider Experience

**Upgrade `FirstAiderDashboard.tsx`**
- Professional stats cards: Total sessions, Average rating, Average response time, This week's sessions
- Today's schedule with "Join" buttons for upcoming sessions
- Active chats with priority indicators (high risk = red, moderate = amber)
- Quick status toggle: Available / Busy / Offline (3-state)
- Calendar sync status with last-synced timestamp
- Session workspace launcher

**New: `SessionWorkspace.tsx`**
- Split-panel: chat/call on left, tools on right
- Quick-access guidance protocol cards
- Secure note-taking with auto-save
- One-click escalation to emergency contacts
- Post-session outcome form (resolved/escalated/follow-up)
- Rating request trigger

### Admin Experience

**Upgrade `CrisisSettings.tsx`** -- new "Sessions" tab
- Session analytics: average duration, resolution rate, satisfaction scores
- First aider performance leaderboard
- Matching algorithm tuning (weight sliders)
- Data retention policy configuration
- Attachment audit log viewer

---

## Translation Keys

Approximately 80-100 new keys added to both `en.json` and `ar.json` covering:
- Smart matching UI labels
- Scheduling/booking flow
- Communication features (typing, read receipts, call UI)
- Secure attachments
- Session workspace
- Professional dashboard stats
- New settings/admin labels

---

## File Summary

### New Files (~15)
- `supabase/migrations/[timestamp]_first_aider_upgrade.sql`
- `supabase/functions/match-first-aider/index.ts`
- `supabase/functions/calendar-sync/index.ts`
- `supabase/functions/secure-upload/index.ts`
- `supabase/functions/signaling-relay/index.ts`
- `src/hooks/crisis/useSmartMatching.ts`
- `src/hooks/crisis/useSessionScheduling.ts`
- `src/hooks/crisis/useEnhancedChat.ts`
- `src/hooks/crisis/useWebRTC.ts`
- `src/hooks/crisis/useSecureAttachments.ts`
- `src/components/crisis/EnhancedChatPanel.tsx`
- `src/components/crisis/VoiceCallPanel.tsx`
- `src/components/crisis/VideoCallPanel.tsx`
- `src/components/crisis/SecureAttachmentUploader.tsx`
- `src/components/crisis/SecureAttachmentViewer.tsx`
- `src/components/crisis/FirstAiderAvailabilityManager.tsx`
- `src/components/crisis/EmployeeBookingWidget.tsx`
- `src/components/crisis/SessionWorkspace.tsx`
- `src/pages/crisis/MySupportSessions.tsx`

### Modified Files (~10)
- `src/pages/crisis/CrisisRequestPage.tsx`
- `src/pages/crisis/FirstAiderDashboard.tsx`
- `src/pages/crisis/MySupportPage.tsx`
- `src/pages/admin/CrisisSettings.tsx`
- `src/hooks/crisis/useCrisisSupport.ts`
- `src/components/crisis/FirstAidersTab.tsx`
- `src/components/crisis/SchedulesTab.tsx`
- `src/App.tsx` (new routes)
- `src/components/layout/AppSidebar.tsx` (new nav items)
- `src/locales/en.json` and `src/locales/ar.json`

---

## Implementation Order

Due to the size, implementation will proceed in this order:

1. **Database migration** (all new tables/columns at once)
2. **Smart matching** (edge function + hook + request page upgrade)
3. **Scheduling** (availability manager + booking widget + sessions)
4. **Enhanced chat** (realtime + typing + reactions + voice notes)
5. **WebRTC calls** (voice + video panels + signaling)
6. **Secure attachments** (upload + viewer + expiry)
7. **Professional dashboards** (first aider + employee + admin)
8. **Translations** (all new keys)

---

## External Dependencies

| Feature | Requirement | Status |
|---------|------------|--------|
| AI Matching | Lovable AI (gemini-3-flash-preview) | Ready (LOVABLE_API_KEY exists) |
| Google Calendar | Google connector via Lovable | Needs user to connect |
| WebRTC STUN | Google public STUN servers | Free, no setup |
| WebRTC TURN | Needed for restrictive networks | Optional, can add later |
| Push Notifications | Existing PWA service worker | Already implemented |

