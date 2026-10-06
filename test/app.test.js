import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { createApp } from "../server/app.js";

async function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "mavi-vadi-test-"));
  const databasePath = join(directory, "test.sqlite");
  let app = createApp({
    databasePath,
    admin: {
      username: "trainer",
      password: "test-password-938",
      name: "Test Eğitmeni",
    },
  });
  await start();
  async function start() {
    app.server.listen(0, "127.0.0.1");
    await once(app.server, "listening");
  }
  async function close() {
    await new Promise((resolve, reject) =>
      app.server.close((error) => (error ? reject(error) : resolve())),
    );
  }
  t.after(async () => {
    await close();
    rmSync(directory, { recursive: true, force: true });
  });
  const client = () => {
    let cookie = "";
    const request = async (path, method = "GET", data) => {
      const response = await fetch(
        `http://127.0.0.1:${app.server.address().port}${path}`,
        {
          method,
          headers: {
            ...(cookie ? { Cookie: cookie } : {}),
            ...(data !== undefined
              ? { "Content-Type": "application/json" }
              : {}),
          },
          body: data !== undefined ? JSON.stringify(data) : undefined,
        },
      );
      if (response.headers.get("set-cookie"))
        cookie = response.headers.get("set-cookie").split(";")[0];
      const type = response.headers.get("content-type");
      return {
        status: response.status,
        headers: response.headers,
        body: type?.includes("json")
          ? await response.json()
          : await response.text(),
      };
    };
    return {
      request,
      login: (username, password) =>
        request("/api/auth/login", "POST", { username, password }),
      getCookie: () => cookie,
    };
  };
  const trainer = client();
  const login = await trainer.login("trainer", "test-password-938");
  assert.equal(login.status, 200);
  const workshop = login.body.workshops[0];
  const url = (resource) => `/api/workshops/${workshop.id}/${resource}`;
  async function participant(username = "participant", roleId = "R3") {
    const result = await trainer.request(url("members"), "POST", {
      username,
      name: username,
      password: "participant-482-password",
      roleId,
    });
    assert.equal(result.status, 200);
    const account = client();
    assert.equal(
      (await account.login(username, "participant-482-password")).status,
      200,
    );
    return account;
  }
  return {
    client,
    trainer,
    workshop,
    url,
    participant,
    getApp: () => app,
    restart: async () => {
      await close();
      app = createApp({ databasePath });
      await start();
    },
  };
}

test("anonymous users can load the app but cannot read workshop data", async (t) => {
  const f = await fixture(t),
    guest = f.client();
  const page = await guest.request("/");
  assert.equal(page.status, 200);
  assert.match(page.body, /<html lang="tr">/);
  assert.equal((await guest.request("/public/../server/store.js")).status, 404);
  assert.equal((await guest.request("/content/grc-v1.json")).status, 404);
  assert.equal((await guest.request(f.url("state"))).status, 401);
  assert.equal((await guest.login("trainer", "wrong-password")).status, 401);
});

test("role briefings stay private and participants cannot operate trainer controls", async (t) => {
  const f = await fixture(t),
    participant = await f.participant();
  const state = await participant.request(f.url("state"));
  assert.equal(state.body.roleId, "R3");
  for (const role of state.body.scenario.roles) {
    if (role.id === "R3")
      assert.ok(role.briefing && role.authority && role.output);
    else
      for (const field of ["briefing", "authority", "steps", "output"])
        assert.equal(role[field], undefined);
  }
  assert.deepEqual(state.body.activity, []);
  for (const [route, method, data] of [
    ["clock", "POST", { action: "start" }],
    ["zones/savanna", "PATCH", { status: "closed", note: "x" }],
    ["announcements", "POST", { title: "test", message: "test" }],
    ["members", "POST", { name: "x" }],
  ]) {
    assert.equal(
      (await participant.request(f.url(route), method, data)).status,
      403,
    );
  }
  assert.equal(
    (
      await participant.request("/api/workshops", "POST", {
        name: "Unauthorized",
      })
    ).status,
    403,
  );
  assert.ok(
    (await f.trainer.request(f.url("state"))).body.scenario.roles.every(
      (r) => r.briefing,
    ),
  );
});

test("workshops, role announcements and personal notes are isolated", async (t) => {
  const f = await fixture(t),
    a = await f.participant("alpha", "R3"),
    b = await f.participant("bravo", "R4");
  const next = (
    await f.trainer.request("/api/workshops", "POST", {
      name: "Second workshop",
    })
  ).body.workshop;
  assert.equal(
    (await a.request(`/api/workshops/${next.id}/state`)).status,
    404,
  );
  assert.equal(
    (await a.request(`/api/workshops/${next.id}/note`, "PUT", { text: "x" }))
      .status,
    404,
  );
  assert.equal((await a.request("/api/me")).body.workshops.length, 1);
  await f.trainer.request(f.url("announcements"), "POST", {
    title: "For everyone",
    message: "Common message",
  });
  await f.trainer.request(f.url("announcements"), "POST", {
    title: "R3 only",
    message: "Private prompt",
    roleId: "R3",
  });
  await a.request(f.url("note"), "PUT", { text: "My private notes" });
  assert.equal((await a.request(f.url("state"))).body.announcements.length, 2);
  assert.equal((await b.request(f.url("state"))).body.announcements.length, 1);
  assert.equal((await a.request(f.url("state"))).body.note, "My private notes");
  assert.equal((await b.request(f.url("state"))).body.note, "");
  assert.equal((await f.trainer.request(f.url("state"))).body.note, "");
  assert.equal(
    (await f.trainer.request(`/api/workshops/${next.id}/state`)).body
      .announcements.length,
    0,
  );
});

test("role changes immediately change the data visible to a participant", async (t) => {
  const f = await fixture(t),
    account = await f.participant();
  const state = (await account.request(f.url("state"))).body;
  await f.trainer.request(f.url(`members/${state.user.id}`), "PATCH", {
    roleId: "R5",
  });
  const after = (await account.request(f.url("state"))).body;
  assert.equal(after.roleId, "R5");
  assert.ok(after.scenario.roles.find((r) => r.id === "R5").briefing);
  assert.equal(
    after.scenario.roles.find((r) => r.id === "R3").briefing,
    undefined,
  );
});

test("zone states, accounts and notes survive a server restart", async (t) => {
  const f = await fixture(t),
    account = await f.participant();
  await account.request(f.url("note"), "PUT", { text: "Saved decision" });
  await f.trainer.request(f.url("zones/water"), "PATCH", {
    status: "monitor",
    note: "Water check pending",
  });
  await f.restart();
  const state = (await account.request(f.url("state"))).body;
  assert.equal(state.note, "Saved decision");
  assert.equal(
    state.scenario.zones.find((z) => z.id === "water").status,
    "monitor",
  );
  assert.equal(
    state.scenario.zones.find((z) => z.id === "water").note,
    "Water check pending",
  );
});

test("clock runs, pauses, changes phase and stops at the end of the workshop", async (t) => {
  const f = await fixture(t);
  let result = await f.trainer.request(f.url("clock"), "POST", {
    action: "start",
  });
  assert.equal(result.body.workshop.status, "running");
  f.getApp().store.run(
    "UPDATE workshops SET started_at=? WHERE id=?",
    Date.now() - 5000,
    f.workshop.id,
  );
  result = await f.trainer.request(f.url("clock"), "POST", { action: "pause" });
  assert.ok(result.body.workshop.elapsed_seconds >= 5);
  assert.equal(result.body.workshop.status, "paused");
  result = await f.trainer.request(f.url("clock"), "POST", {
    action: "phase",
    phase: "quality",
  });
  assert.equal(result.body.workshop.elapsed_seconds, 1200);
  assert.equal(result.body.phase.id, "quality");
  assert.equal(
    (
      await f.trainer.request(f.url("clock"), "POST", {
        action: "phase",
        phase: "invalid",
      })
    ).status,
    400,
  );
  f.getApp().store.run(
    "UPDATE workshops SET elapsed=14399, started_at=?, status='running' WHERE id=?",
    Date.now() - 3000,
    f.workshop.id,
  );
  result = await f.trainer.request(f.url("state"));
  assert.equal(result.body.workshop.elapsed_seconds, 14400);
  assert.equal(result.body.workshop.status, "completed");
  assert.equal(
    (await f.trainer.request(f.url("clock"), "POST", { action: "start" }))
      .status,
    400,
  );
});

test("password change invalidates all sessions; logout invalidates its session", async (t) => {
  const f = await fixture(t),
    a = await f.participant(),
    b = f.client();
  await b.login("participant", "participant-482-password");
  assert.match(a.getCookie(), /^mv_session=/);
  assert.equal(
    (
      await a.request("/api/password", "POST", {
        current: "incorrect",
        password: "new-password-842",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await a.request("/api/password", "POST", {
        current: "participant-482-password",
        password: "new-password-842",
      })
    ).status,
    200,
  );
  assert.equal((await b.request("/api/me")).status, 401);
  assert.equal(
    (await a.login("participant", "participant-482-password")).status,
    401,
  );
  assert.equal((await a.login("participant", "new-password-842")).status, 200);
  await a.request("/api/auth/logout", "POST", {});
  assert.equal((await a.request("/api/me")).status, 401);
});

test("invalid input does not modify state; duplicate accounts are rejected", async (t) => {
  const f = await fixture(t);
  await f.participant();
  const duplicate = await f.trainer.request(f.url("members"), "POST", {
    username: "participant",
    name: "Duplicate",
    password: "long-enough-password",
    roleId: "R2",
  });
  assert.equal(duplicate.status, 409);
  assert.equal(
    (
      await f.trainer.request(f.url("zones/water"), "PATCH", {
        status: "unknown",
        note: "",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await f.trainer.request(f.url("announcements"), "POST", {
        title: "T",
        message: "M",
        roleId: "invalid",
      })
    ).status,
    400,
  );
  assert.equal(
    (await f.trainer.request(f.url("note"), "PUT", { text: "x".repeat(4001) }))
      .status,
    400,
  );
  const result = await f.trainer.request(f.url("state"));
  assert.equal(result.body.members.length, 1);
  assert.equal(
    result.body.scenario.zones.find((z) => z.id === "water").status,
    "open",
  );
});

test("cross-origin mutation requests are rejected and auth cookies are HttpOnly", async (t) => {
  const f = await fixture(t);
  const port = f.getApp().server.address().port;
  const login = await f.client().login("trainer", "test-password-938");
  assert.match(login.headers.get("set-cookie"), /HttpOnly; SameSite=Lax/);
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: {
      Origin: "https://unrelated.example",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: "trainer",
      password: "test-password-938",
    }),
  });
  assert.equal(response.status, 403);
});
