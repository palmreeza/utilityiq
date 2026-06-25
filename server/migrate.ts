/**
 * Database migration runner.
 * Reads all SQL migration files and applies them in order using a
 * __drizzle_migrations tracking table — idempotent and safe to run on every startup.
 * Works with DATABASE_URL, MYSQL_URL, or MYSQL_PRIVATE_URL.
 */
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function getDbUrl(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL ||
    process.env.MYSQL_PRIVATE_URL ||
    ""
  );
}

/**
 * Resolve the drizzle migrations directory.
 * In dev:  server/migrate.ts → ../../drizzle  (from server/ up to project root, then drizzle/)
 * In prod: dist/index.js is a flat bundle — use import.meta.url to find dist/, then ../drizzle
 *
 * We try both paths and use whichever exists.
 */
function findDrizzleDir(): string {
  const candidates: string[] = [];

  // Path relative to this source file (works in dev with tsx)
  try {
    const thisFile = fileURLToPath(import.meta.url);
    const fromSrc = path.resolve(path.dirname(thisFile), "../drizzle");
    candidates.push(fromSrc);
    const fromSrc2 = path.resolve(path.dirname(thisFile), "../../drizzle");
    candidates.push(fromSrc2);
  } catch {
    // import.meta.url not available in some bundler contexts
  }

  // Fallback: relative to the current working directory (Railway sets cwd to /app)
  candidates.push(path.resolve(process.cwd(), "drizzle"));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `[Migrate] Cannot find drizzle migrations directory. Tried: ${candidates.join(", ")}`
  );
}

export async function runMigrations(): Promise<void> {
  const dbUrl = getDbUrl();
  if (!dbUrl) {
    console.warn("[Migrate] No database URL found — skipping migrations.");
    return;
  }

  let connection: mysql.Connection | null = null;
  try {
    const url = new URL(dbUrl);
    const sslParam = url.searchParams.get("ssl");
    const sslConfig = sslParam ? JSON.parse(decodeURIComponent(sslParam)) : undefined;

    connection = await mysql.createConnection({
      host: url.hostname,
      port: parseInt(url.port || "3306"),
      user: url.username,
      password: url.password,
      database: url.pathname.replace("/", ""),
      ssl: sslConfig,
      multipleStatements: true,
    });

    // Create the migrations tracking table — drop and recreate if schema is stale
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS __uiq_migrations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tag VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch {
      // Table creation failed — try to continue anyway
    }

    const drizzleDir = findDrizzleDir();
    console.log(`[Migrate] Using migrations directory: ${drizzleDir}`);

    const sqlFiles = fs
      .readdirSync(drizzleDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (sqlFiles.length === 0) {
      console.log("[Migrate] No SQL migration files found.");
      return;
    }

    for (const file of sqlFiles) {
      const tag = file.replace(".sql", "");

      const [rows] = await connection.execute(
        "SELECT id FROM __uiq_migrations WHERE tag = ?",
        [tag]
      );
      if ((rows as unknown[]).length > 0) {
        console.log(`[Migrate] Already applied: ${tag}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(drizzleDir, file), "utf-8");

      // Split on the Drizzle breakpoint marker and execute each statement
      const statements = sql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        try {
          await connection.execute(statement);
        } catch (stmtErr: unknown) {
          // MySQL error 1050 = Table already exists — safe to skip
          // MySQL error 1060 = Duplicate column — safe to skip
          const code = (stmtErr as { code?: string })?.code;
          if (code === 'ER_TABLE_EXISTS_ERROR' || code === 'ER_DUP_FIELDNAME' || code === 'ER_DUP_KEYNAME') {
            console.log(`[Migrate] Skipping (already exists): ${statement.slice(0, 60).replace(/\n/g, ' ')}...`);
          } else {
            throw stmtErr;
          }
        }
      }

      await connection.execute(
        "INSERT INTO __uiq_migrations (tag) VALUES (?)",
        [tag]
      );
      console.log(`[Migrate] Applied: ${tag}`);
    }

    console.log("[Migrate] All migrations up to date.");
  } catch (err) {
    console.error("[Migrate] Migration failed:", err);
    throw err;
  } finally {
    if (connection) await connection.end();
  }
}
