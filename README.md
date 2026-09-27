# Team Operational Architecture

An operational system for coordinating research programmes, people, events, tasks, documentation, and recurring workflows.

![Dashboard screenshot](screenshots/dashboard-screenshot.png)

**[Live interactive demo →](https://team-operational-architecture-8dtngann9npecppulknp8r.streamlit.app/)**
---

## Why I built this

Small research and education teams often operate across spreadsheets, calendars, documents, email, and individual knowledge.

The difficulty is making sure that information reliably leads to action:

* Who is responsible for this?
* What needs to happen next?
* Is this event internal or public?
* Has the preparation been completed?
* Has the calendar been updated?
* Is a research milestone approaching?
* Has someone forgotten to enter required information?
* What happens when an automation fails?

---

# The Task

The organisation runs several types of research and education programmes:

### Research Intensive

A short, full-time programme involving participants, instructors, sessions, research activities, and recurring administrative work.

### Research Fellowship

A longer programme in which fellows work with mentors on individual research projects, with milestones, meetings, reviews, and final deliverables.

### Research Events

Conferences, workshops, seminars, and research sessions involving speakers, participants, rooms, public-facing information, and event preparation.

### Research Residency

A temporary programme bringing researchers and staff together in one location, creating another layer of recurring operational coordination.


---

# System architecture

```text
                    SYNTHETIC SOURCE DATA
                            |
          +-----------------+-----------------+
          |                 |                 |
       People            Programs          Events
          |                 |                 |
          +-----------------+-----------------+
                            |
                    OPERATIONAL LAYER
                            |
       +--------------------+--------------------+
       |                    |                    |
     Tasks              Calendar             Dashboard
       |                    |                    |
       +--------------------+--------------------+
                            |
                       AUTOMATIONS
                            |
        +-------------------+-------------------+
        |                   |                   |
     Reminders        Calendar Sync       Duplicate Checks
        |                   |                   |
        +-------------------+-------------------+
                            |
                    AUTOMATION LOG
                            |
                     HUMAN REVIEW
```

---

# Example: event workflow

A team member creates an event in the operational tracker.

```text
Create event
     |
     v
Assign responsible person
     |
     v
Choose Internal / Public
     |
     v
Validate required fields
     |
     v
Calendar synchronization
     |
     +------> Internal calendar
     |
     +------> Public calendar
                |
                v
          Public event view
     |
     v
Event takes place
     |
     v
Attendance / follow-up recorded
     |
     v
Reporting updated
```


---

# Public vs. internal information

Public visibility is deliberately controlled.

An event marked as public exposes only information intended for external audiences, such as:

* event title
* date/time
* location

Internal notes, personal information, operational comments, and other non-public fields remain inside the operational system.

---

# Cancellation

Cancellation is treated as a change in state rather than a separate manual process.

```text
Status = Cancelled
        |
        v
Calendar automation
        |
        +------> Remove internal event
        |
        +------> Remove public event
        |
        +------> Record action in log
```


---

# Tasks and reminders

Recurring operational work is represented as tasks with:

* owner
* due date
* priority
* status
* related programme/event/project
* associated SOP

Automations can identify tasks that are approaching their deadline or remain incomplete.


---

# Technology

* **Google Sheets** — operational interface and structured records
* **Google Apps Script** — lightweight automation
* **Google Calendar** — event output
* **CSV** — synthetic source data
* **Markdown** — documentation
* **Git/GitHub** — version control and public documentation

---

# Design principles

### 1. Make normal work easy

People interacting with the system should not need to understand its implementation.

### 2. Make exceptions visible

Missing information and failures should surface rather than disappear.

### 3. Automate repetitive coordination

Repeated reminders, synchronization, status checks, and notifications are good candidates for automation.

### 4. Keep humans responsible for judgement

Automation should support decisions rather than silently make irreversible ones.

### 5. Separate configuration from implementation

Operational changes should not require code changes wherever practical.

### 6. Treat documentation as part of the system

An SOP is more useful when it is connected to the process that requires it.

### 7. Design for maintainability

A small team should be able to understand what the system is doing and change it without needing a large engineering team.

---

# Data and confidentiality

This repository is an independent synthetic reconstruction.
All people, organisations, email addresses, programmes, events, research projects, financial figures, and records are fictional.
