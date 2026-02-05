process.env.DB_FILE = ":memory:";

const request = require("supertest");

const app = require("../server");
const db = require("../db");

async function seedOne(date, temp = 10) {
  const res = await request(app).post("/api/logs").send({
    log_date: date,
    location: "Testville",
    temp_c: temp,
    condition: "Sunny",
    notes: "seed",
  });
  return res;
}

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await db.run("DELETE FROM daily_logs");
});

describe("Weather Tracker API", () => {
  test("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test("POST /api/logs creates a log", async () => {
    const res = await seedOne("2026-02-05", 12.3);
    expect(res.status).toBe(201);
    expect(res.body.log_date).toBe("2026-02-05");
    expect(res.body.temp_c).toBe(12.3);
  });

  test("GET /api/logs returns created logs", async () => {
    await seedOne("2026-02-05", 1);
    await seedOne("2026-02-04", 2);

    const res = await request(app).get("/api/logs");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].log_date).toBe("2026-02-05");
  });

  test("PUT /api/logs/:id updates a log", async () => {
    const created = await seedOne("2026-02-05", 3);
    const id = created.body.id;

    const updated = await request(app)
      .put(`/api/logs/${id}`)
      .send({ temp_c: 7.5, condition: "Cloudy" });

    expect(updated.status).toBe(200);
    expect(updated.body.id).toBe(id);
    expect(updated.body.temp_c).toBe(7.5);
    expect(updated.body.condition).toBe("Cloudy");
  });

  test("DELETE /api/logs/:id deletes a log", async () => {
    const created = await seedOne("2026-02-05", 3);
    const id = created.body.id;

    const del = await request(app).delete(`/api/logs/${id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/logs/${id}`);
    expect(get.status).toBe(404);
  });
});
