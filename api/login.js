import { supabase } from "../lib/supabase.js";

const SUCCESS_PAYLOAD = {
  latestVersion: "5.4.0",
  updateUrl: "https://cyrax.info/product/download/7",
  cntnrUrl: "https://cyrax.info/product/download/3",
  status: ":)",
  userType: 1,
  debug: 1,
  myMessage: "Login Success - Premium",
  encryption: "d66128c252e9a4acb3ae07d8618600af",
  changelog: "\u{1F31F}Fixed some bugs",
  keyId: "1337",
  antiban_dns: "invalidlogin.cyrax,info",
  secret: "0f59c663de99de8ff19063",
  secret2: "297742a6b2fee53a65cbc2",
};

function failurePayload(myMessage) {
  return {
    latestVersion: "5.4.0",
    updateUrl: "https://cyrax.info/product/download/7",
    cntnrUrl: "https://cyrax.info/product/download/3",
    status: ":(",
    userType: 0,
    debug: 1,
    myMessage,
    encryption: "",
    changelog: "",
    keyId: "",
    antiban_dns: "invalidlogin.cyrax,info",
    secret: "",
    secret2: "",
  };
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
      resolve(req.body);
      return;
    }

    if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
      resolve(Object.fromEntries(new URLSearchParams(req.body.toString())));
      return;
    }

    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(Object.fromEntries(new URLSearchParams(raw)));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, failurePayload("Method Not Allowed"));
  }

  let body;
  try {
    body = await parseBody(req);
  } catch {
    return sendJson(res, 400, failurePayload("Invalid Request Body"));
  }

  const keycode =
    typeof body.keycode === "string" ? body.keycode.trim() : "";

  if (!keycode) {
    return sendJson(res, 400, failurePayload("Missing Keycode"));
  }

  try {
    const { data, error } = await supabase
      .from("licenses")
      .select("id, keycode, is_active")
      .eq("keycode", keycode)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Supabase query error:", error.message);
      return sendJson(res, 500, failurePayload("Server Error"));
    }

    if (!data) {
      return sendJson(res, 200, failurePayload("Invalid Key"));
    }

    return sendJson(res, 200, SUCCESS_PAYLOAD);
  } catch (error) {
    console.error("Login handler error:", error);
    return sendJson(res, 500, failurePayload("Server Error"));
  }
}
