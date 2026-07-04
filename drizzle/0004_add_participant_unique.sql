-- Step 1: Remove duplicate assessment_participants rows (keep lowest id per assessmentId+userId)
--> statement-breakpoint
DELETE ap FROM `assessment_participants` ap
INNER JOIN (
  SELECT MIN(id) as keep_id, assessmentId, userId
  FROM `assessment_participants`
  GROUP BY assessmentId, userId
) keep_rows ON ap.assessmentId = keep_rows.assessmentId
  AND ap.userId = keep_rows.userId
  AND ap.id != keep_rows.keep_id;
--> statement-breakpoint
-- Step 2: Add unique constraint (safe now that duplicates are removed)
ALTER TABLE `assessment_participants` ADD UNIQUE INDEX `uq_ap_assessment_user` (`assessmentId`, `userId`);
