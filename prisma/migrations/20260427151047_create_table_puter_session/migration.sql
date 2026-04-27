-- CreateTable
CREATE TABLE "puter_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "puter_username" TEXT,
    "puter_uid" TEXT,
    "app_uid" TEXT,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "validated_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "puter_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "puter_session_userId_idx" ON "puter_sessions"("userId");

-- CreateIndex
CREATE INDEX "puter_session_is_valid_idx" ON "puter_sessions"("is_valid");

-- CreateIndex
CREATE UNIQUE INDEX "puter_sessions_userId_key" ON "puter_sessions"("userId");

-- AddForeignKey
ALTER TABLE "puter_sessions" ADD CONSTRAINT "puter_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
