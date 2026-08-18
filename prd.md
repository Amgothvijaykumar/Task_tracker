# PRD: DSA Daily Tracker

> **Status:** In Progress | **Owner:** Amgoth Vijay Kumar | **Last Updated:** 2026-08-18

---

## 1. Product Overview

| Field | Details |
| --- | --- |
| **Product Name** | DSA Daily Tracker |
| **One-Line Description** | A web platform where an admin posts daily DSA problems and tracks each student's progress in real time. |
| **Problem** | Daily DSA challenges shared in chat groups have no structured assignment, progress tracking, or accountability. |
| **Why now** | Students need a lightweight habit-building system; the admin needs visibility without manual follow-up sheets. |
| **Vision** | A focused accountability platform for DSA communities, with daily problem tracking and easy LinkedIn sharing. |

## 2. Problem Statement

Running a daily DSA challenge community through WhatsApp or similar channels is unstructured. The admin can post a problem, but cannot reliably tell who has started, completed, skipped, or fallen behind. Students have no dedicated place to commit to a problem, record progress, see their streak, or share their learning consistently.

Current workarounds—chat messages, spreadsheets, and voluntary LinkedIn posts—are manual and incomplete. The product should centralize the daily challenge workflow without trying to become an online judge or a social network.

## 3. Goals and Non-Goals

### Goals

| # | Goal | Initial success measure |
| --- | --- | --- |
| 1 | Build a daily DSA habit | Active students complete at least one problem on most active days. |
| 2 | Give the admin activity visibility | Per-problem and per-student started/completed/skipped data is available. |
| 3 | Reduce manual tracking | Problem publishing and student status capture happen in the platform. |
| 4 | Encourage professional sharing | Students can create an editable LinkedIn post after completion. |
| 5 | Grow the community | Support onboarding 100+ students in the first month. |

### Non-Goals (v1)

- Automatic code evaluation, submissions, or plagiarism detection.
- AI hints, explanations, or tutoring.
- Coding-platform integrations (LeetCode, HackerRank, etc.).
- Multiple admin roles, payments, notifications, chat, or discussion forums.
- Automatic posting to LinkedIn or WhatsApp.

## 4. Target Users

### Admin — Vijay, Community Leader

A technically confident final-year CSE student and content creator who publishes daily challenges. Vijay needs a quick way to publish problems, review engagement, and identify students who have not completed any problem on a selected day.

### Student — Ravi, Consistent Learner

An engineering student preparing for placements. Ravi wants an uncluttered daily feed, a clear way to mark work as started or completed, and a visible record of his streak.

### Student — Priya, Selective Solver

A working professional preparing for a switch. Priya may not solve every daily problem and needs to hide or skip irrelevant ones without affecting the work she chooses to track.

## 5. User Stories

### Admin

- As an admin, I can log in securely so that only I can access administration features.
- As an admin, I can create, edit, publish, unpublish, and archive a problem.
- As an admin, I can schedule multiple problems for the same date.
- As an admin, I can view per-problem counts of assigned, started, completed, skipped, and hidden states.
- As an admin, I can view each student’s activity and identify students with no completion on a selected date.

### Student

- As a student, I can register and log in to access a personal dashboard.
- As a student, I can browse published problems by date and difficulty.
- As a student, I can assign a problem to myself and mark it started or completed.
- As a student, I can skip or hide a problem that is not relevant to me.
- As a student, I can view my completion history and current streak.
- As a student, I can draft an editable LinkedIn post after completing a problem.

---

## 6. Scope and Feature Requirements

### 6.1 Authentication and roles

| Requirement | Priority | Acceptance criteria |
| --- | --- | --- |
| Student sign-up and sign-in | Must | A student can create an account with email/password or sign in through an approved OAuth provider, then sign in and out. |
| Admin sign-in | Must | An authorized admin can sign in with email/password or an approved OAuth provider; students cannot access admin routes. |
| Session protection | Must | Unauthenticated users are redirected to sign-in for protected pages. |
| Profile basics | Should | Students can edit display name and optional LinkedIn profile URL. |

**Authentication model:** v1 supports two sign-in options: **email and password** and **OAuth** (initially Google OAuth). Supabase Auth manages both methods. On a student's first OAuth sign-in, the app creates or links a student profile using the verified email address. Accounts with the same verified email must be linked rather than duplicated.

**Role model:** v1 supports `admin` and `student`. The initial admin is provisioned directly in the database or authentication provider; there is no self-service admin registration. OAuth identity alone does not grant admin access—Django checks the stored application role on every protected API request.

### 6.2 Admin problem management

The admin can create a problem with the fields below. A problem is visible to students only when its status is `published` and its scheduled date is today or earlier (future visibility can be enabled later).

| Field | Required | Rules |
| --- | --- | --- |
| Title | Yes | 3–120 characters; e.g., “Two Sum”. |
| Problem URL | Yes | Valid absolute URL to the original problem. |
| Description / note | No | Context, constraints, or a short prompt; max 2,000 characters. |
| Difficulty | Yes | One of `Easy`, `Medium`, `Hard`. |
| Topic tags | No | Up to five tags, e.g. Array, Hash Map, DP. |
| Scheduled date | Yes | A calendar date in the community’s configured timezone. |
| Estimated time | No | Whole minutes, from 5 to 480. |
| Status | Yes | `draft`, `published`, or `archived`. |

Admin requirements:

- Create multiple problems for a date.
- Edit drafts at any time; edit published content without deleting existing student progress.
- Archive a problem to remove it from normal student feeds while retaining history and reporting.
- Filter the management list by date, status, difficulty, and tag.
- Never hard-delete a problem from the UI in v1.

### 6.3 Student daily problem feed

The student dashboard defaults to the current date, with date navigation for previous published days. Each problem card displays title, difficulty, tags, estimated time, scheduled date, a source link, and the student’s personal status.

Supported actions:

| Action | Result |
| --- | --- |
| **Assign** | Creates a personal tracker record in `assigned` state. |
| **Start** | Changes the personal state to `started`; the problem remains assigned. |
| **Complete** | Changes the state to `completed`, records a completion timestamp, and offers the sharing flow. |
| **Skip** | Changes the state to `skipped`; it remains visible in history. |
| **Hide** | Changes the state to `hidden`; it is removed from the default feed but can be restored from a hidden filter. |
| **Restore** | Changes a hidden item back to `unassigned`. |

Students may change their own status. Completing a problem after it was skipped is allowed. A completed problem cannot be hidden; the student must first change it to skipped or unassigned.

### 6.4 Daily accountability and streaks

“At least one problem per day” is a product nudge, not a blocking enforcement mechanism. The platform must not prevent students from using other features when they have no completion.

Definitions:

- **Qualified day:** A local calendar day on which a student completed at least one published problem.
- **Current streak:** Consecutive qualified days ending today; if there is no completion today, it may end yesterday so students can see an in-progress daily cadence. The UI must label this behavior clearly.
- **Longest streak:** Highest number of consecutive qualified days in the student’s history.
- **Daily inactive student:** An enrolled student with no completed problem for the selected date after that date has begun.

The student dashboard should show a prominent “Complete 1 problem today” progress indicator, current streak, longest streak, and a history calendar/list. The admin dashboard should show the number and names of inactive students for the selected date.

### 6.5 LinkedIn sharing helper

After a completion, show a share modal or page containing a generated, editable post. It must include the problem title, difficulty, optional topic tags, and a placeholder for the student's reflection. The student can copy the text and open LinkedIn’s sharing composer in a new tab.

Example default copy:

> ✅ DSA Daily Tracker — Day {streak}\n\n> Today I solved: {problem_title} ({difficulty})\n> Topics: {tags}\n\n> What I learned: {student_can_edit_this}\n\n> #DSA #CodingInterview #Consistency

Requirements:

- The platform records a `share_clicked_at` timestamp when the user chooses “Open LinkedIn.”
- It does not claim the post was published, since LinkedIn cannot confirm that in v1.
- Copying and opening LinkedIn are both optional and never change completion state.

### 6.6 Admin analytics dashboard

The dashboard should provide a selected-date view and a rolling 7-day view.

| Area | Required insight |
| --- | --- |
| Community summary | Total enrolled students; active students; completions; completion rate; share clicks. |
| Problem performance | Per-problem counts and rates for assigned, started, completed, skipped, hidden, and share clicks. |
| Student activity | Student name, today’s completed count, current streak, last completion, and status. |
| Follow-up list | Students with no completion on the selected date. |
| Trends | Daily completions and active-student count across the last seven days. |

All rates should show their denominator. For example, daily completion rate is `students with >=1 completion / enrolled active students` for the selected date.

---

## 7. Key User Flows

### 7.1 Admin publishes a daily challenge

1. Admin signs in and opens **Manage Problems**.
2. Admin selects **Create problem**, supplies required details, and chooses a scheduled date.
3. Admin saves as a draft or publishes it.
4. When published, the problem appears in eligible students’ date feed.
5. The dashboard begins collecting interaction and completion data.

### 7.2 Student completes a problem

1. Student signs in and opens the dashboard.
2. Student selects the day’s problem and chooses **Assign** or **Start**.
3. Student solves the problem on the external source platform.
4. Student returns and chooses **Complete**.
5. The dashboard updates the daily goal, history, and streak.
6. Student may edit/copy a LinkedIn draft and open LinkedIn.

### 7.3 Admin follows up on inactive students

1. Admin opens analytics and chooses a date.
2. Admin views **No completion yet** list.
3. Admin uses this information manually to send a community reminder outside the app.

---

## 8. Information Architecture and Screens

| Screen | Audience | Main content and actions |
| --- | --- | --- |
| Landing / sign-in | All | Product value, sign-in, sign-up. |
| Student dashboard | Student | Daily goal, streak cards, date picker, published problem cards, personal status controls. |
| Problem detail | Student | Full problem note, source link, status action, sharing entry point after completion. |
| Progress history | Student | Calendar/list of qualified days, totals, completed problems, hidden/skipped filters. |
| Share draft | Student | Editable LinkedIn text, copy action, open-LinkedIn action. |
| Admin overview | Admin | Community KPIs, selected-date activity, inactive list, 7-day trends. |
| Manage problems | Admin | Filterable problem table and create/edit/archive actions. |
| Create/edit problem | Admin | Validated form for problem metadata and publishing. |
| Student activity | Admin | Searchable student table with recent activity and streaks. |

### UX principles

- Make the primary next action obvious: complete one problem today.
- Keep status controls quick and reversible where possible.
- Use text labels plus color for difficulty and status; do not rely on color alone.
- Design mobile-first because students are likely to arrive from a group-chat link.
- Use India Standard Time by default, with the timezone visible wherever a date is interpreted.

---

## 9. Business Rules and Edge Cases

| Situation | Expected behavior |
| --- | --- |
| Multiple problems in one day | Any single completion qualifies the day for streak/accountability purposes. |
| Completion after midnight | Count it on the date/time of the completion in the configured community timezone, not the problem’s scheduled date. |
| Future scheduled problem | Do not display it on the normal student feed until its date; admin can preview it. |
| Archived problem | Keep it visible in the student’s historical completed list and analytics; exclude it from new assignments. |
| Published problem edited | Preserve student tracking and completion timestamps. |
| Student deleted/deactivated | Exclude from current active-rate denominators; preserve anonymized historical reporting where legally appropriate. |
| Duplicate completion action | Remain idempotent: one tracker record and the original completion timestamp. |
| Student marks completed without external proof | Allow it; v1 uses self-reported progress. |
| No problems posted today | Show a friendly empty state and retain streak/history views. |

---

## 10. Data Model

### Entities

| Entity | Key fields | Notes |
| --- | --- | --- |
| `users` | id, name, email, role, status, linkedin_url, created_at | `role` is `admin` or `student`; email is unique. |
| `problems` | id, title, source_url, description, difficulty, scheduled_date, estimated_minutes, publication_status, created_by, created_at, updated_at | Tags may be stored separately or as an array. |
| `problem_tags` | problem_id, tag_id | Join table if tags are normalized. |
| `tags` | id, name, slug | Topic vocabulary. |
| `student_problem_progress` | id, student_id, problem_id, status, assigned_at, started_at, completed_at, skipped_at, hidden_at, share_clicked_at, updated_at | One row per student/problem, enforced by unique `(student_id, problem_id)`. |
| `daily_activity_summary` | student_id, activity_date, completed_count, qualified_day | Optional materialized table/cache for dashboard performance. |

### Status state transitions

```text
unassigned → assigned → started → completed
     │           │         └──────→ skipped
     │           └────────────────→ skipped
     └────────────────────────────→ hidden → unassigned

skipped → assigned | started | completed | hidden
completed → started | skipped | unassigned
```

Status changes should be recorded with timestamps but v1 does not require a separate audit-log UI.

---

## 11. Functional Acceptance Criteria

### Student experience

- A registered student can see all published, eligible problems for a chosen date.
- A student can independently assign, start, complete, skip, hide, and restore a problem according to the stated rules.
- Completing one or more problems updates the selected date’s daily goal and relevant streak calculations without a page refresh.
- A student can review historical completions and status records.
- A completion exposes an editable share draft, a copy action, and an Open LinkedIn action.

### Admin experience

- An admin can create a draft, publish it, edit it, and archive it.
- A non-admin cannot view or call admin functions.
- Admin analytics accurately aggregate the personal progress records for the date/range chosen.
- The inactive-student list contains all active students with zero completions for the chosen date and excludes students who completed at least one problem.

### Reliability

- Duplicate clicks and retried requests do not create duplicate progress records or completions.
- The app presents useful empty, loading, and error states.
- Dates and streaks are calculated consistently in the configured timezone.

---

## 12. Non-Functional Requirements

| Category | Requirement |
| --- | --- |
| Performance | Main dashboard should load its initial content in under 2.5 seconds on a typical mobile connection for 100 students and 30 days of data. |
| Responsive design | Support modern mobile, tablet, and desktop browsers; mobile is the primary layout. |
| Accessibility | Keyboard-operable controls, visible focus states, semantic forms, readable contrast, and status text not conveyed by color alone. |
| Security | Use authenticated server-side authorization for every protected request; hash passwords through the chosen auth provider; validate URLs and all form inputs. |
| Privacy | Display only community-relevant student activity to the admin; do not expose private email addresses in student-facing UI. |
| Availability | No special uptime SLA for v1; show graceful failures and preserve completed actions on retry. |
| Observability | Record application errors and key product events: signup, problem published, assigned, started, completed, and share clicked. |

---

## 13. Metrics and Events

### Product metrics

| Metric | Definition |
| --- | --- |
| Daily active students | Distinct students who view the dashboard or update a problem on a local day. |
| Daily completion rate | Active enrolled students with at least one completion ÷ enrolled active students. |
| Problem completion rate | Students who completed a problem ÷ students who assigned or started it. |
| 7-day retention | Students active in a given week who are also active seven days later. |
| Share-click rate | Completed problems with an Open LinkedIn click ÷ completed problems. |
| Median current streak | Median current streak among enrolled active students. |

### Events to capture

`student_signed_up`, `student_signed_in`, `problem_created`, `problem_published`, `problem_assigned`, `problem_started`, `problem_completed`, `problem_skipped`, `problem_hidden`, `linkedin_draft_copied`, `linkedin_share_opened`.

Each event should contain user ID, relevant problem ID where applicable, timestamp, and client timezone. Do not include the editable LinkedIn text in analytics events.

---

## 14. Recommended v1 Technical Direction

This is the selected v1 technical stack:

- **Frontend:** React with TypeScript, using a responsive component library or Tailwind CSS.
- **Backend:** Django with Python, exposing a REST API for the React application.
- **Database:** Supabase PostgreSQL, accessed by Django through its PostgreSQL connection; Supabase also manages database migrations, backups, and row-level security where appropriate.
- **Auth:** Supabase Auth with both email/password and Google OAuth sign-in. Django verifies Supabase access tokens and enforces role-based authorization for every protected API endpoint.
- **Hosting:** Deploy the React frontend and Django backend separately on managed hosting compatible with the team’s deployment preferences; use Supabase for the managed database and authentication services.
- **Analytics/error tracking:** A lightweight product analytics and error-monitoring service, added after core tracking works.

The implementation must keep role checks and aggregate calculations in Django. Django should own application schema migrations and use Supabase as the PostgreSQL service; it should also provide seeded local data for development. The React client must never be trusted to authorize admin actions or calculate authoritative streaks.

---

## 15. Delivery Plan

| Phase | Scope | Exit criteria |
| --- | --- | --- |
| 0. Foundation | Repository, database schema, auth, roles, design tokens, seed data | Admin and student accounts can sign in to protected starter pages. |
| 1. Core tracking | Admin problem CRUD; student date feed; status transitions | A student can complete a published problem and the record persists. |
| 2. Accountability | Streak/history logic; daily goal; admin selected-date activity and inactive list | Streaks and inactive list are correct for seeded edge cases. |
| 3. Sharing and polish | LinkedIn draft/copy/open flow, filters, loading/error/empty states, responsive and accessibility QA | Full happy path works well on mobile and desktop. |
| 4. Launch | Production deployment, initial admin, community onboarding, monitoring | Pilot community can use the product for a week without manual tracking. |

### MVP cut line

The minimum usable release includes authentication, admin problem publishing, student status tracking, daily goal/streak, student history, and selected-date admin visibility. LinkedIn share drafting and 7-day charts can follow if schedule is constrained.

---

## 16. Risks, Assumptions, and Open Questions

### Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Students forget to return and update status | Make completion a single-tap action and show a persistent daily goal; share a dashboard link in the existing community channel. |
| Self-reported completions are inaccurate | Clearly position the platform as an accountability tracker, not proof of solved work. |
| Admin publishes late or misses days | Support scheduled drafts and a clear empty state rather than breaking streak history. |
| LinkedIn behavior changes | Keep sharing as a copy-plus-external-link helper; never depend on API publishing. |
| Metric definitions become inconsistent | Centralize timezone and qualified-day calculations in backend code and test edge cases. |

### Assumptions

- There is one community and one default timezone (IST) in v1.
- Students join voluntarily and self-report their work honestly.
- External problem URLs remain the source of truth for problem statements and solutions.
- The initial community can be managed by a single admin.

### Open questions to resolve before implementation

1. Should students be able to register freely, or should sign-up require an invite/community code?
2. Should scheduled future problems be visible as a preview, or completely hidden until the scheduled date?
3. Is completion allowed for a previous day, and should that backfill a streak based on the completion date or scheduled date?
4. Does “skip” require a reason, or is a simple personal state sufficient?
5. Should Google OAuth be the only OAuth provider at launch, or should GitHub OAuth be included too?
6. Will LinkedIn share clicks be enough as the sharing metric, or should students optionally paste their post URL afterward?

---

## 17. Launch Criteria

The product is ready for a pilot when:

- An admin can publish a problem for today and students can see it.
- A student can update every supported status and see progress persist across sign-in sessions.
- A completed problem updates the daily goal and streak correctly in IST.
- Admin analytics and the inactive list agree with the underlying student progress data.
- The core student flow is usable on a mobile viewport.
- Authentication and authorization have been tested for both roles.
- A pilot group of 5–10 students completes a real daily workflow and feedback is reviewed.

---

## Appendix: Terminology

| Term | Meaning |
| --- | --- |
| Published problem | A problem visible to students according to its publication state and scheduled date. |
| Progress record | A student-specific status record for one problem. |
| Qualified day | A day with at least one completed problem. |
| Streak | Consecutive qualified days under the configured timezone rules. |
| Active student | An enrolled, non-deactivated student. |
| Share click | A recorded action opening LinkedIn from the product; it is not confirmation of publication. |
