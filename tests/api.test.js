const request = require("supertest");
const { createApp } = require("../src/app");
const { createDatabase } = require("../src/db");

let app;
let db;

beforeEach(() => {
  db = createDatabase(":memory:");
  app = createApp({ db });
});
afterEach(() => db.close());

const futureWeekday = "2099-10-19T09:00:00";

describe("API de citas", () => {
  test("health check", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  test("rechaza campos obligatorios ausentes", async () => {
    const response = await request(app).post("/api/appointments").send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/obligatorios/);
  });

  test("crea cita válida de paciente adulto", async () => {
    const response = await request(app).post("/api/appointments").send({
      patientName: "Ana Pérez", dateOfBirth: "1990-01-01", doctorId: "MED-001", startAt: futureWeekday
    });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ message: "Cita reservada correctamente.", patientCategory: "adulto" });
  });

  test("bloquea choque de citas", async () => {
    const payload = { patientName: "Ana Pérez", dateOfBirth: "1990-01-01", doctorId: "MED-001", startAt: futureWeekday };
    expect((await request(app).post("/api/appointments").send(payload)).status).toBe(201);
    const second = await request(app).post("/api/appointments").send({ ...payload, patientName: "Luis Ruiz" });
    expect(second.status).toBe(409);
    expect(second.body.rule).toBe("choque");
  });

  test("rechaza menor sin representante", async () => {
    const response = await request(app).post("/api/appointments").send({
      patientName: "Paciente menor", dateOfBirth: "2015-01-01", doctorId: "MED-001", startAt: futureWeekday
    });
    expect(response.status).toBe(400);
    expect(response.body.rule).toBe("edad");
  });

  test("rechaza horario no operativo", async () => {
    const response = await request(app).post("/api/appointments").send({
      patientName: "Ana Pérez", dateOfBirth: "1990-01-01", doctorId: "MED-001", startAt: "2099-10-19T07:30:00.000Z"
    });
    expect(response.status).toBe(400);
    expect(response.body.rule).toBe("horario");
  });

  test("lista y cancela cita, evitando una segunda cancelación", async () => {
    const created = await request(app).post("/api/appointments").send({
      patientName: "Ana Pérez", dateOfBirth: "1990-01-01", doctorId: "MED-001", startAt: futureWeekday
    });
    const id = created.body.id;
    expect((await request(app).get("/api/appointments")).body).toHaveLength(1);
    const cancelled = await request(app).post(`/api/appointments/${id}/cancel`).send({ isEmergency: true });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.penalty).toBe(0);
    expect((await request(app).post(`/api/appointments/${id}/cancel`).send({ isEmergency: false })).status).toBe(409);
  });

  test("responde 404 para cita inexistente", async () => {
    expect((await request(app).post("/api/appointments/999/cancel").send({ isEmergency: false })).status).toBe(404);
  });

  test("rechaza identificador de cita inválido", async () => {
    expect((await request(app).post("/api/appointments/nope/cancel").send({})).status).toBe(400);
  });
});
