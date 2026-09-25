# AI question pipeline

AI is an authoring aid, not the runtime test engine.

Pipeline:
1. Generate questions in batches for a configured exam stage, subject, topic, difficulty and language.
2. Validate schema and require exactly four unique options.
3. Verify exactly one correct option and require an explanation.
4. Reject duplicates and near-duplicates against the existing question pool.
5. Validate exam/stage/subject/topic/language metadata.
6. Send valid items to a review queue.
7. Only approved questions enter the reusable production pool.
8. Tests select approved questions from the pool; students never trigger an AI generation call.

This keeps test delivery deterministic, cost-controlled and auditable.
