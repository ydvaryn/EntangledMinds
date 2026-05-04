# Security Specification - EntangledMinds

## Data Invariants
1. A user cannot modify another user's profile.
2. Only admins can create/update tutorials and categories.
3. Comments must be linked to the authenticated user's ID.
4. Favorites must be owned by the user who created them.
5. All writes must satisfy schema constraints (types, sizes, required keys).
6. Timestamps (`created_at`, `updated_at`) must be server-generated.

## The Dirty Dozen (Test Matrix)

| ID | Collection | Action | Payload | Expected | Reason |
|----|------------|--------|---------|----------|--------|
| D1 | users | update | { role: 'admin' } | DENIED | Privilege escalation |
| D2 | users | update | { email: 'new@email.com' } | DENIED | Immutable field change |
| D3 | tutorials | create | { title: 'Hack' } | DENIED | Non-admin write |
| D4 | comments | create | { user_id: 'other_id' } | DENIED | Identity spoofing |
| D5 | favorites | create | { user_id: 'other_id' } | DENIED | Identity spoofing |
| D6 | tutorials | create | { content: 'x'.repeat(2*1024*1024) } | DENIED | Resource exhaustion (too large) |
| D7 | users | create | { name: 123 } | DENIED | Type mismatch |
| D8 | comments | create | { created_at: '2020-01-01' } | DENIED | Client timestamp injection |
| D9 | users | get | someone_else_id | ALLOWED | Profiles are public in this app |
| D10 | favorites | list | - | DENIED | No blanket reading of favorites |
| D11 | contact_msgs | read | - | DENIED | Non-admin reading support logs |
| D12 | tutorials | update | { author_id: 'me' } | DENIED | Non-admin updating content |
