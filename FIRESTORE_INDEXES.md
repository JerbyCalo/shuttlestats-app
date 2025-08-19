# Firestore Composite Indexes

Create these composite indexes in Firestore to enable server-side sorting with per-user filters.

Collections and indexes:

1) training_sessions
- where: userId == {uid}, orderBy: date desc

2) matches
- where: userId == {uid}, orderBy: date desc

3) schedule_sessions
- where: userId == {uid}, orderBy: date asc

4) goals
- where: userId == {uid}, orderBy: createdAt desc

Notes
- After deploying, check Firestore console Indexes tab for "create index" prompts based on query errors.
- Keep date fields as strings in YYYY-MM-DD for schedule.date; for timestamps (createdAt/updatedAt), use Firestore Timestamp (serverTimestamp on writes).
- If you change data types (e.g., store schedule.date as Timestamp), update indexes accordingly.
