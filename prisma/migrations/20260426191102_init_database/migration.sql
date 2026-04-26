-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerk_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT,
    "avatar" TEXT,
    "role_id" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "role_name_idx" ON "roles"("name");

-- CreateIndex
CREATE INDEX "role_level_idx" ON "roles"("level");

-- CreateIndex
CREATE INDEX "role_created_at_idx" ON "roles"("created_at");

-- CreateIndex
CREATE INDEX "role_updated_at_idx" ON "roles"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_level_key" ON "roles"("name", "level");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE INDEX "account_type_idx" ON "accounts"("type");

-- CreateIndex
CREATE INDEX "account_provider_idx" ON "accounts"("provider");

-- CreateIndex
CREATE INDEX "account_providerAccountId_idx" ON "accounts"("providerAccountId");

-- CreateIndex
CREATE INDEX "account_refresh_token_idx" ON "accounts"("refresh_token");

-- CreateIndex
CREATE INDEX "account_access_token_idx" ON "accounts"("access_token");

-- CreateIndex
CREATE INDEX "account_expires_at_idx" ON "accounts"("expires_at");

-- CreateIndex
CREATE INDEX "account_token_type_idx" ON "accounts"("token_type");

-- CreateIndex
CREATE INDEX "account_scope_idx" ON "accounts"("scope");

-- CreateIndex
CREATE INDEX "account_id_token_idx" ON "accounts"("id_token");

-- CreateIndex
CREATE INDEX "account_session_state_idx" ON "accounts"("session_state");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "session_sessionToken_idx" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_userId_key" ON "sessions"("sessionToken", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerk_id_key" ON "users"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "user_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "user_updated_at_idx" ON "users"("updated_at");

-- CreateIndex
CREATE INDEX "user_email_verified_at_idx" ON "users"("email_verified_at");

-- CreateIndex
CREATE INDEX "user_last_login_at_idx" ON "users"("last_login_at");

-- CreateIndex
CREATE INDEX "user_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "user_clerk_id_idx" ON "users"("clerk_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_role_id_key" ON "users"("email", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_token_identifier_idx" ON "verification_tokens"("identifier");

-- CreateIndex
CREATE INDEX "verification_token_token_idx" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_token_expires_idx" ON "verification_tokens"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "setting_key_idx" ON "settings"("key");

-- CreateIndex
CREATE INDEX "setting_group_name_idx" ON "settings"("group_name");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_group_name_key" ON "settings"("key", "group_name");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
