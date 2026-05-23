import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { pbkdf2Sync, randomBytes, randomUUID } from "node:crypto";

const root = process.cwd();
await loadLocalEnv();
const port = Number(process.env.PORT || 5173);
const dbPath = join(root, "data", "db.json");
const mailboxPath = join(root, "data", "mailbox.json");
let mongoCollectionsPromise;

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

async function loadLocalEnv() {
  try {
    const env = await readFile(join(root, ".env"), "utf8");
    for (const line of env.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split("=");
      if (!process.env[key]) {
        process.env[key] = valueParts.join("=");
      }
    }
  } catch {
    // Hosting providers inject env vars directly; local .env is optional.
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function loadDb() {
  if (process.env.DATABASE_URL) {
    const { users, sessions, passwordResets } = await getMongoCollections();
    return {
      users: await users.find({}).project({ _id: 0 }).toArray(),
      sessions: await sessions.find({}).project({ _id: 0 }).toArray(),
      passwordResets: await passwordResets.find({}).project({ _id: 0 }).toArray(),
    };
  }

  try {
    const db = JSON.parse(await readFile(dbPath, "utf8"));
    db.users ||= [];
    db.sessions ||= [];
    db.passwordResets ||= [];
    return db;
  } catch {
    return { users: [], sessions: [], passwordResets: [] };
  }
}

async function saveDb(db) {
  if (process.env.DATABASE_URL) {
    const { users, sessions, passwordResets } = await getMongoCollections();
    await Promise.all([users.deleteMany({}), sessions.deleteMany({}), passwordResets.deleteMany({})]);
    await Promise.all([
      db.users.length ? users.insertMany(db.users) : Promise.resolve(),
      db.sessions.length ? sessions.insertMany(db.sessions) : Promise.resolve(),
      db.passwordResets.length ? passwordResets.insertMany(db.passwordResets) : Promise.resolve(),
    ]);
    return;
  }

  await mkdir(join(root, "data"), { recursive: true });
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`);
}

async function getMongoCollections() {
  if (!mongoCollectionsPromise) {
    mongoCollectionsPromise = (async () => {
      const { MongoClient } = await import("mongodb");
      const client = new MongoClient(process.env.DATABASE_URL);
      await client.connect();
      const database = client.db(process.env.MONGODB_DB || "soft_skill_dashboard");
      const users = database.collection("users");
      const sessions = database.collection("sessions");
      const passwordResets = database.collection("passwordResets");

      await Promise.all([
        users.createIndex({ email: 1 }, { unique: true }),
        users.createIndex({ studentCode: 1 }, { unique: true }),
        sessions.createIndex({ token: 1 }, { unique: true }),
        passwordResets.createIndex({ email: 1 }, { unique: true }),
      ]);

      return { users, sessions, passwordResets };
    })();
  }

  return mongoCollectionsPromise;
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex");
  return { salt, hash };
}

function createResetCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendResetMail(email, code) {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Mã đặt lại mật khẩu Soft Skill Dashboard",
      text: `Mã đặt lại mật khẩu của bạn là ${code}. Mã có hiệu lực trong 10 phút.`,
    });
    return;
  }

  let mailbox = [];
  try {
    mailbox = JSON.parse(await readFile(mailboxPath, "utf8"));
  } catch {
    mailbox = [];
  }

  const message = {
    to: email,
    subject: "Mã đặt lại mật khẩu Soft Skill Dashboard",
    body: `Mã đặt lại mật khẩu của bạn là ${code}. Mã có hiệu lực trong 10 phút.`,
    code,
    createdAt: new Date().toISOString(),
  };

  mailbox.unshift(message);
  await mkdir(join(root, "data"), { recursive: true });
  await writeFile(mailboxPath, `${JSON.stringify(mailbox, null, 2)}\n`);
  console.log(`[mail-demo] Gửi mã đặt lại mật khẩu đến ${email}: ${code}`);
}

function safeUser(user) {
  const { passwordHash, passwordSalt, ...publicUser } = user;
  return publicUser;
}

function getBearerToken(req) {
  const auth = req.headers.authorization || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

function validateRequired(body, fields) {
  return fields.filter((field) => !String(body[field] || "").trim());
}

function normalizeScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(number)));
}

function calculateTrend(previousScores, nextScores) {
  if (!previousScores) {
    return 0;
  }

  const previousValues = Object.values(previousScores);
  const nextValues = Object.values(nextScores);
  const previousAverage = previousValues.reduce((sum, value) => sum + value, 0) / previousValues.length;
  const nextAverage = nextValues.reduce((sum, value) => sum + value, 0) / nextValues.length;

  return Math.round(nextAverage - previousAverage);
}

async function handleApi(req, res, url) {
  try {
    if (req.method === "POST" && url.pathname === "/api/auth/register") {
      const body = await readJsonBody(req);
      const missing = validateRequired(body, ["name", "email", "studentCode", "password", "major", "year"]);
      if (missing.length) {
        return sendJson(res, 400, { message: "Vui lòng nhập đầy đủ thông tin đăng ký." });
      }

      const db = await loadDb();
      const email = String(body.email).trim().toLowerCase();
      const studentCode = String(body.studentCode).trim().toUpperCase();

      if (db.users.some((user) => user.email === email)) {
        return sendJson(res, 409, { message: "Email này đã được đăng ký." });
      }

      if (db.users.some((user) => user.studentCode === studentCode)) {
        return sendJson(res, 409, { message: "Mã số sinh viên này đã được đăng ký." });
      }

      const { salt, hash } = hashPassword(String(body.password));
      const user = {
        id: randomUUID(),
        name: String(body.name).trim(),
        email,
        studentCode,
        passwordSalt: salt,
        passwordHash: hash,
        major: String(body.major).trim(),
        year: String(body.year).trim(),
        attendance: null,
        trend: null,
        scores: null,
        evidence: [],
        createdAt: new Date().toISOString(),
      };
      const token = randomBytes(32).toString("hex");

      db.users.push(user);
      db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
      await saveDb(db);

      return sendJson(res, 201, { token, user: safeUser(user) });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readJsonBody(req);
      const missing = validateRequired(body, ["email", "studentCode", "password"]);
      if (missing.length) {
        return sendJson(res, 400, { message: "Vui lòng nhập email, mã số sinh viên và mật khẩu." });
      }

      const db = await loadDb();
      const email = String(body.email).trim().toLowerCase();
      const studentCode = String(body.studentCode).trim().toUpperCase();
      const user = db.users.find((item) => item.email === email && item.studentCode === studentCode);
      const passwordHash = user ? hashPassword(String(body.password), user.passwordSalt).hash : "";

      if (!user || passwordHash !== user.passwordHash) {
        return sendJson(res, 401, { message: "Email, mã số sinh viên hoặc mật khẩu không đúng." });
      }

      const token = randomBytes(32).toString("hex");
      db.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
      await saveDb(db);

      return sendJson(res, 200, { token, user: safeUser(user) });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/forgot-password") {
      const body = await readJsonBody(req);
      const missing = validateRequired(body, ["email"]);
      if (missing.length) {
        return sendJson(res, 400, { message: "Vui lòng nhập email đã đăng ký." });
      }

      const db = await loadDb();
      const email = String(body.email).trim().toLowerCase();
      const user = db.users.find((item) => item.email === email);

      if (!user) {
        return sendJson(res, 404, { message: "Không tìm thấy tài khoản với email này." });
      }

      const code = createResetCode();
      const { salt, hash } = hashPassword(code);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      db.passwordResets = db.passwordResets.filter((item) => item.userId !== user.id);
      db.passwordResets.push({
        userId: user.id,
        email,
        codeSalt: salt,
        codeHash: hash,
        expiresAt,
        createdAt: new Date().toISOString(),
      });
      await saveDb(db);
      await sendResetMail(email, code);

      return sendJson(res, 200, { message: "Mã đặt lại mật khẩu đã được gửi về email." });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/reset-password") {
      const body = await readJsonBody(req);
      const missing = validateRequired(body, ["email", "code", "password"]);
      if (missing.length) {
        return sendJson(res, 400, { message: "Vui lòng nhập email, mã xác thực và mật khẩu mới." });
      }

      const db = await loadDb();
      const email = String(body.email).trim().toLowerCase();
      const user = db.users.find((item) => item.email === email);
      const reset = db.passwordResets.find((item) => item.email === email);

      if (!user || !reset) {
        return sendJson(res, 400, { message: "Mã xác thực không hợp lệ hoặc chưa được gửi." });
      }

      if (new Date(reset.expiresAt).getTime() < Date.now()) {
        db.passwordResets = db.passwordResets.filter((item) => item.email !== email);
        await saveDb(db);
        return sendJson(res, 400, { message: "Mã xác thực đã hết hạn. Vui lòng gửi lại mã." });
      }

      const codeHash = hashPassword(String(body.code).trim(), reset.codeSalt).hash;
      if (codeHash !== reset.codeHash) {
        return sendJson(res, 400, { message: "Mã xác thực không đúng." });
      }

      const { salt, hash } = hashPassword(String(body.password));
      user.passwordSalt = salt;
      user.passwordHash = hash;
      user.updatedAt = new Date().toISOString();
      db.passwordResets = db.passwordResets.filter((item) => item.email !== email);
      db.sessions = db.sessions.filter((item) => item.userId !== user.id);
      await saveDb(db);

      return sendJson(res, 200, { message: "Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới." });
    }

    if (req.method === "GET" && url.pathname === "/api/me") {
      const db = await loadDb();
      const token = getBearerToken(req);
      const session = db.sessions.find((item) => item.token === token);
      const user = session ? db.users.find((item) => item.id === session.userId) : null;

      if (!user) {
        return sendJson(res, 401, { message: "Phiên đăng nhập không hợp lệ." });
      }

      return sendJson(res, 200, { user: safeUser(user) });
    }

    if (req.method === "PUT" && url.pathname === "/api/me/assessment") {
      const db = await loadDb();
      const token = getBearerToken(req);
      const session = db.sessions.find((item) => item.token === token);
      const user = session ? db.users.find((item) => item.id === session.userId) : null;

      if (!user) {
        return sendJson(res, 401, { message: "Phiên đăng nhập không hợp lệ." });
      }

      const body = await readJsonBody(req);
      const scores = {
        communication: normalizeScore(body.scores?.communication),
        teamwork: normalizeScore(body.scores?.teamwork),
        leadership: normalizeScore(body.scores?.leadership),
        criticalThinking: normalizeScore(body.scores?.criticalThinking),
        timeManagement: normalizeScore(body.scores?.timeManagement),
        adaptability: normalizeScore(body.scores?.adaptability),
      };

      if (Object.values(scores).some((value) => value === null)) {
        return sendJson(res, 400, { message: "Vui lòng nhập đầy đủ điểm kỹ năng từ 0 đến 100." });
      }

      const attendance = normalizeScore(body.attendance);
      if (attendance === null) {
        return sendJson(res, 400, { message: "Vui lòng nhập tỷ lệ chuyên cần từ 0 đến 100." });
      }

      const evidence = String(body.evidence || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      user.trend = calculateTrend(user.scores, scores);
      user.scores = scores;
      user.attendance = attendance;
      user.evidence = evidence;
      user.updatedAt = new Date().toISOString();

      await saveDb(db);

      return sendJson(res, 200, { user: safeUser(user) });
    }

    if (req.method === "POST" && url.pathname === "/api/auth/logout") {
      const db = await loadDb();
      const token = getBearerToken(req);
      db.sessions = db.sessions.filter((item) => item.token !== token);
      await saveDb(db);

      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 404, { message: "Không tìm thấy API." });
  } catch {
    return sendJson(res, 500, { message: "Lỗi server. Vui lòng thử lại." });
  }
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://localhost:${port}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    const cleanPath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    const filePath = join(root, cleanPath === "/" ? "index.html" : cleanPath);
    const data = await readFile(filePath);

    res.writeHead(200, {
      "Content-Type": types[extname(filePath)] || "application/octet-stream",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Không tìm thấy tài nguyên.");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Dashboard đang chạy tại http://127.0.0.1:${port}`);
});
