<!--
Sync Impact Report
Version change: unversioned scaffold -> 1.0.0
Modified principles: unpopulated template -> five defined core principles
Added sections: Technical Constraints; Development Workflow
Removed sections: none
Follow-up TODOs: Confirm the original ratification date.
-->

# PJ Constitution

## Core Principles

### I. Approved Technology Stack
The frontend MUST use React. The backend MUST use Node.js with Express, and persistent
application data MUST use SQLite. Contributors MUST follow these choices and the
technologies already used by the project unless an amendment explicitly authorizes a
change. This keeps the system coherent and maintainable.

### II. Clear Responsibility and Reuse
Code MUST be organized into components, modules, and files with clear, separate
responsibilities. Before creating a new component, function, or structure, contributors
MUST check whether an existing one can be reused. New abstractions MUST be limited to
those that improve clarity or prevent meaningful duplication.

### III. Accessible, Legible Interface
The interface MUST be easy to understand and operate, and MUST meet applicable
accessibility requirements, including keyboard operation, semantic structure, and
sufficient contrast. The visual design MUST use delicate pastel pink tones while
preserving legibility and clear interaction states.

### IV. Safe Backend and Behavior Preservation
Backend input MUST be validated at the point it enters the application. Errors MUST be
handled explicitly and returned or reported in a way appropriate to the interface; the
backend MUST NOT disguise failures as successful results. Existing functionality MUST
remain unchanged unless a requested change requires otherwise, and any necessary
behavioral change MUST be deliberate and covered by appropriate tests.

### V. Simplicity and Maintainability
Solutions MUST favor straightforward, readable, and maintainable code over unnecessary
complexity. Changes MUST be explained clearly, and implementations MUST use the
project's established patterns and technologies. Rationale for any necessary deviation
MUST be documented with the change.

## Technical Constraints

The frontend is React; the backend is Node.js with Express; and the database is SQLite.
Data crossing the backend boundary MUST be validated, and errors MUST be handled
explicitly. User-facing changes MUST preserve accessibility and the project's pastel-pink
visual direction without sacrificing contrast or readability.

## Development Workflow

Before implementation, contributors MUST inspect the relevant existing code for reusable
components, functions, and established patterns. Changes MUST be scoped to the requested
behavior, with unrelated functionality left intact. New or changed behavior MUST be
validated using relevant tests or other project checks; any unavailable validation MUST
be disclosed. Change summaries MUST explain what changed and identify deviations from
the established stack or patterns.

## Governance

This constitution governs project decisions and MUST be used to assess proposed and
completed changes. Amendments require a documented proposal describing the motivation
and impact, review and approval by the project maintainers, and an update to this
document. Changes MUST increment the constitution version using semantic versioning:
MAJOR for incompatible governance or principle changes, MINOR for new principles or
materially expanded requirements, and PATCH for clarifications and non-semantic edits.
Every amendment MUST update the last-amended date and include an impact summary.

Contributors and reviewers MUST check relevant changes for compliance with these
principles during implementation and review. A deviation requires explicit justification
and maintainer approval in the change record. If project practice conflicts with this
constitution, the conflict MUST be raised for resolution before the affected change is
approved.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown | **Last Amended**: 2026-10-15
