const jsonHeaders = {
  "Content-Type": "application/json",
};

export function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

function supabaseConfig(env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const missing = [!url && "SUPABASE_URL", !key && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean).join(" und ");
    throw new Error(`Supabase ist noch nicht verbunden. Zur Laufzeit fehlt: ${missing}.`);
  }
  return { url: url.replace(/\/$/, ""), key };
}

export async function supabase(env, path, options = {}) {
  const { url, key } = supabaseConfig(env);
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase Fehler ${response.status}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export function cleanString(value, fallback = "") {
  return String(value || fallback).trim().slice(0, 120);
}

function cleanCount(value) {
  return Math.max(3, Math.min(35, Number(value || 24)));
}

function codePart(value, fallback) {
  return cleanString(value, fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || fallback;
}

function randomCode(length) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export async function createRoom(env, room) {
  const school = cleanString(room.school, "Schule");
  const className = cleanString(room.className || room.class_name, "Klasse");
  const existing = await supabase(
    env,
    `rooms?school=eq.${encodeURIComponent(school)}&class_name=eq.${encodeURIComponent(className)}&limit=1`,
  );

  if (existing.length) {
    const mappings = await supabase(
      env,
      `rooms?school=eq.${encodeURIComponent(existing[0].code)}&class_name=eq.__TEACHER__&select=code&limit=1`,
    );
    if (mappings.length) {
      const error = new Error("Diese Klasse wurde bereits erstellt. Nutze den Lehrer-Code unter „Bestehende Klasse verwalten“.");
      error.statusCode = 409;
      throw error;
    }
    const teacherCode = `LEHRER-${randomCode(5)}`;
    await supabase(env, "rooms", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        code: `T-${teacherCode}`,
        school: existing[0].code,
        class_name: "__TEACHER__",
        student_count: existing[0].student_count,
      }),
    });
    return { ...existing[0], id: existing[0].code, teacher_code: teacherCode };
  }

  const schoolParts = codePart(school, "SCHULE").split("-");
  const schoolShort = schoolParts.at(-1).slice(0, 12);
  const classCode = `${codePart(className, "KLASSE")}-${schoolShort}-${Math.floor(100 + Math.random() * 900)}`;
  const teacherCode = `LEHRER-${randomCode(5)}`;
  const payload = {
    code: classCode,
    school,
    class_name: className,
    student_count: cleanCount(room.studentCount || room.student_count),
  };

  const rows = await supabase(env, "rooms", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  await supabase(env, "rooms", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      code: `T-${teacherCode}`,
      school: classCode,
      class_name: "__TEACHER__",
      student_count: payload.student_count,
    }),
  });
  return { ...rows[0], id: rows[0].code, teacher_code: teacherCode };
}
