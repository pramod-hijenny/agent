const endpoint = "http://127.0.0.1:9223";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getPageWebSocket() {
  const tabs = await fetch(`${endpoint}/json`).then((response) => response.json());
  const page = tabs.find((tab) => tab.type === "page");
  if (!page) throw new Error("No Chrome page target found");
  return page.webSocketDebuggerUrl;
}

async function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  });

  function send(method, params = {}) {
    const messageId = ++id;
    socket.send(JSON.stringify({ id: messageId, method, params }));
    return new Promise((resolve, reject) => pending.set(messageId, { resolve, reject }));
  }

  return { socket, send };
}

async function evaluate(client, source, timeout = 6000) {
  const result = await client.send("Runtime.evaluate", {
    expression: source,
    awaitPromise: true,
    returnByValue: true,
    timeout,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime.evaluate failed");
  }
  return result.result.value;
}

async function waitFor(client, source, label, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const value = await evaluate(client, source, 2000).catch(() => false);
    if (value) return value;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

const wsUrl = await getPageWebSocket();
const client = await connect(wsUrl);
await client.send("Page.enable");
await client.send("Runtime.enable");
await evaluate(client, `localStorage.clear(); location.href = "/auth"; true`);

const results = [];
async function step(name, action) {
  await action();
  results.push({ step: name, status: "passed" });
}

await step("auth page renders demo login", async () => {
  await waitFor(
    client,
    `document.body.innerText.includes("Use demo account") && location.pathname === "/auth"`,
    "auth demo button",
  );
});

await step("demo login seeds profile and opens home feed", async () => {
  await evaluate(
    client,
    `(() => {
      [...document.querySelectorAll("button")]
        .find((button) => button.innerText.includes("Use demo account"))
        .click();
      return true;
    })()`,
  );
  await waitFor(
    client,
    `location.pathname === "/app/home" && document.body.innerText.includes("Social feed") && JSON.parse(localStorage.getItem("agentcircle:user") || "{}").full_name === "Alex Morgan"`,
    "home feed after demo login",
  );
});

await step("home feed like and save controls respond", async () => {
  const value = await evaluate(
    client,
    `(() => {
      const like = [...document.querySelectorAll("button")].find((button) => button.innerText.includes("Like"));
      const save = document.querySelector('button[aria-label="Save post"]');
      if (!like || !save) return { ok: false };
      like.click();
      save.click();
      return {
        ok: true,
        likeClass: like.className,
        saveClass: save.className,
      };
    })()`,
  );
  if (!value?.ok) {
    throw new Error("Like/save controls were not clickable");
  }
});

await step("discover agent chat approves and sends an intro", async () => {
  await evaluate(client, `location.href = "/app/discover"; true`);
  await waitFor(
    client,
    `location.pathname === "/app/discover" && document.body.innerText.includes("Find people worth meeting")`,
    "discover page",
  );
  await evaluate(
    client,
    `(() => {
      const chat = [...document.querySelectorAll("button")].find((button) => button.innerText.includes("Agent chat"));
      if (!chat) throw new Error("Agent chat button not found");
      chat.click();
      return true;
    })()`,
  );
  await waitFor(client, `document.body.innerText.includes("Agents talking")`, "agent chat dialog");
  await waitFor(
    client,
    `[...document.querySelectorAll("button")].some((button) => button.innerText.includes("Approve Intro"))`,
    "approve intro button",
    12000,
  );
  await evaluate(
    client,
    `(() => {
      [...document.querySelectorAll("button")]
        .find((button) => button.innerText.includes("Approve Intro"))
        .click();
      return true;
    })()`,
  );
  await waitFor(
    client,
    `document.body.innerText.includes("Approve intro request")`,
    "intro approval dialog",
  );
  await evaluate(
    client,
    `(() => {
      const textarea = document.querySelector("textarea");
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
      setter.call(textarea, textarea.value + "\\n\\nBrowser smoke test: confirming the intro flow works.");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      [...document.querySelectorAll("button")]
        .find((button) => button.innerText.includes("Send Intro Request"))
        .click();
      return true;
    })()`,
  );
  await waitFor(
    client,
    `JSON.parse(localStorage.getItem("agentcircle:intros") || "[]").length >= 3`,
    "new intro in localStorage",
  );
});

await step("inbox can mark pending intro accepted", async () => {
  await evaluate(client, `location.href = "/app/inbox"; true`);
  await waitFor(
    client,
    `location.pathname === "/app/inbox" && document.body.innerText.includes("Messages")`,
    "inbox page",
  );
  await evaluate(
    client,
    `(() => {
      const buttons = [...document.querySelectorAll("button")].filter((item) => item.innerText.includes("Mark accepted"));
      buttons.forEach((button) => button.click());
      return buttons.length;
    })()`,
  );
  await waitFor(
    client,
    `JSON.parse(localStorage.getItem("agentcircle:intros") || "[]").every((intro) => intro.status !== "pending")`,
    "all pending intros accepted",
  );
});

await step("agent page sends a test message and receives reply", async () => {
  await evaluate(client, `location.href = "/app/agent"; true`);
  await waitFor(
    client,
    `location.pathname === "/app/agent" && document.body.innerText.includes("My Agent")`,
    "agent page",
  );
  await evaluate(
    client,
    `(() => {
      const input = [...document.querySelectorAll("input")].find((item) => item.placeholder.includes("Ask your agent"));
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      setter.call(input, "Find three mentors for onboarding UX");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      return true;
    })()`,
  );
  await waitFor(
    client,
    `document.body.innerText.includes("Maya Chen") && document.body.innerText.includes("Sofia Alvarez") && document.body.innerText.includes("Omar Williams")`,
    "agent reply",
    4000,
  );
});

await step("profile, connections, and settings routes render", async () => {
  for (const [path, text] of [
    ["/app/profile/me", "Alex Morgan"],
    ["/app/connections", "Connections"],
    ["/app/settings", "Settings"],
  ]) {
    await evaluate(client, `location.href = "${path}"; true`);
    await waitFor(
      client,
      `location.pathname === "${path}" && document.body.innerText.includes("${text}")`,
      path,
    );
  }
});

console.log(JSON.stringify({ ok: true, results }, null, 2));
client.socket.close();
