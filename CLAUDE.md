<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/001-ai-native-crm-platform/plan.md
<!-- SPECKIT END -->

## Project Layout

All application source code, tests, configs, and Docker files live under `target/`.
The top level contains only research, planning, specs, and orchestration.

- `target/` — Next.js application (run `pnpm` commands from here)
- `specs/` — Feature specifications, plans, contracts, tasks
- `*.md` (top-level) — Research documents and project notes
- `.specify/` — Spec Kit configuration and templates
