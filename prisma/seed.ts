import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hash } from "bcryptjs";
import { ensureBucketExists } from "../src/lib/minio";

async function main() {
  console.log("🌱 Seeding database...\n");

  console.log("📋 Creating roles...");
  const roles = [
    { name: "admin", level: 100 },
    { name: "moderator", level: 50 },
    { name: "user", level: 1 },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { role_name_level_unique: { name: role.name, level: role.level } },
      update: {},
      create: role,
    });
    console.log(`  ✅ Role: ${role.name} (level ${role.level})`);
  }

  // ── 2. Admin User ─────────────────────────────────────────────────────────
  console.log("\n👤 Creating admin user...");
  const adminRole = await prisma.role.findFirst({ where: { name: "admin" } });
  if (!adminRole) throw new Error("Admin role tidak ditemukan");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const adminName = process.env.ADMIN_NAME || "Administrator";

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const password_hash = await hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password_hash,
        role_id: adminRole.id,
        email_verified_at: new Date(),
        is_active: true,
      },
    });
    console.log(`  ✅ Admin: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`  ⏭️  Admin sudah ada: ${adminEmail}`);
  }

  // ── 3. Settings Default ───────────────────────────────────────────────────
  console.log("\n⚙️  Creating default settings...");
  const settings = [
    // General
    { key: "site_name", value: "AI Chat", group_name: "general" },
    { key: "site_description", value: "Platform Chat AI dengan berbagai model AI terkini", group_name: "general" },
    { key: "site_keywords", value: "AI, Chat, Image, Video, Generate", group_name: "general" },
    { key: "site_theme", value: "dark", group_name: "general" },
    { key: "is_maintenance", value: "false", group_name: "general" },
    // Auth
    { key: "enable_register", value: "true", group_name: "auth" },
    { key: "enable_github_provider", value: "true", group_name: "auth" },
    { key: "enable_google_provider", value: "true", group_name: "auth" },
    // AI
    { key: "default_provider", value: "anthropic", group_name: "ai" },
    { key: "default_model_id", value: "claude-sonnet-4", group_name: "ai" },
    // Storage
    { key: "max_upload_size_mb", value: "50", group_name: "storage" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: {
        setting_key_group_name_unique: { key: setting.key, group_name: setting.group_name },
      },
      update: {},
      create: setting,
    });
  }
  console.log(`  ✅ ${settings.length} settings dibuat`);

  // ── 4. MinIO Bucket ───────────────────────────────────────────────────────
  console.log("\n🪣  Setting up MinIO bucket...");
  try {
    await ensureBucketExists();
    console.log(`  ✅ MinIO bucket "aichat-media" siap`);
  } catch (err) {
    console.warn(`  ⚠️  MinIO tidak tersedia: ${err}`);
    console.warn(`     Pastikan MinIO berjalan dan variabel env MINIO_* sudah diisi`);
  }

  console.log("\n🎉 Seeding selesai!");
  console.log(`\n   Login dengan: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error("\n❌ Seed gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
