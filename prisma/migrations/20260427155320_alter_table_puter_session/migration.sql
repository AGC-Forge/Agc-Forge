-- DropIndex
DROP INDEX "puter_session_userId_idx";

-- RenameIndex
ALTER INDEX "puter_sessions_userId_key" RENAME TO "puter_session_userId_unique";
