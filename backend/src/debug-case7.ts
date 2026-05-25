import axios from "axios";
import { prisma } from "./utils/prisma";

const BASE = "http://localhost:5000";
const phone = "2562546246";
const otp = "123456";

function extractCookies(headers: any, jar: Record<string, string>) {
  const raw = headers["set-cookie"] as string[] | undefined;
  if (raw) {
    for (const c of raw) {
      const semiIdx = c.indexOf(";");
      const pair = semiIdx === -1 ? c : c.slice(0, semiIdx);
      const eqIdx = pair.indexOf("=");
      if (eqIdx !== -1) {
        const k = pair.slice(0, eqIdx).trim();
        const v = pair.slice(eqIdx + 1).trim();
        jar[k] = v;
      }
    }
  }
}

async function main() {
  const jar: Record<string, string> = {};

  // Clean sessions
  const user = await prisma.user.findUnique({ where: { phone } });
  if (user) {
    const deleted = await prisma.userSession.deleteMany({
      where: { userId: user.id },
    });
    console.log("Sessions deleted:", deleted.count);
  }

  await axios.post(BASE + "/auth/send-otp", { phone }, { validateStatus: () => true });

  const loginRes = await axios.post(
    BASE + "/auth/verify-otp",
    { phone, otp },
    { validateStatus: () => true }
  );
  extractCookies(loginRes.headers, jar);
  console.log("Login status:", loginRes.status);
  const oldToken = jar.refreshToken;
  console.log("Old token (first 60 chars):", oldToken?.slice(0, 60));
  console.log("Old token full length:", oldToken?.length);

  // Rotate
  const rotateRes = await axios.post(BASE + "/auth/refresh", {}, {
    validateStatus: () => true,
    headers: { Cookie: `refreshToken=${oldToken}` },
  });
  extractCookies(rotateRes.headers, jar);
  console.log("\nRotate status:", rotateRes.status, rotateRes.data);
  console.log("New token (first 60 chars):", jar.refreshToken?.slice(0, 60));
  console.log("Same token?", oldToken === jar.refreshToken);

  // Check DB sessions
  const userAfter = await prisma.user.findUnique({ where: { phone } });
  const sessionsAfter = userAfter
    ? await prisma.userSession.findMany({ where: { userId: userAfter.id } })
    : [];
  console.log("\nSessions in DB after rotation:", sessionsAfter.length);
  sessionsAfter.forEach((s, i) =>
    console.log(`  Session ${i}: hash prefix = ${s.refreshToken.slice(0, 10)}`)
  );

  // Replay old token
  console.log("\nSending OLD token back...");
  const reuseRes = await axios.post(BASE + "/auth/refresh", {}, {
    validateStatus: () => true,
    headers: { Cookie: `refreshToken=${oldToken}` },
  });
  console.log(
    "REUSE status (expected 401):",
    reuseRes.status,
    JSON.stringify(reuseRes.data)
  );

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("ERROR:", err.message);
  await prisma.$disconnect();
  process.exit(1);
});
