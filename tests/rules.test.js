const {
  calculateAge,
  validatePatientAge,
  validateOperatingHours,
  hasAppointmentConflict,
  calculateCancellationPenalty
} = require("../src/rules");

describe("Regla 1: clasificación por edad", () => {
  test("rechaza fecha de nacimiento inválida", () => {
    expect(validatePatientAge("fecha-no-valida", "")).toMatchObject({ ok: false });
  });
  test("requiere representante para paciente menor de edad", () => {
    expect(validatePatientAge("2015-05-10", "", new Date("2026-10-19T12:00:00"))).toMatchObject({ ok: false });
  });
  test("acepta paciente pediátrico con representante", () => {
    expect(validatePatientAge("2015-05-10", "Representante", new Date("2026-10-19T12:00:00"))).toMatchObject({ ok: true, category: "pediatrico" });
  });
  test("acepta paciente adulto", () => {
    expect(validatePatientAge("1990-01-01", "", new Date("2026-10-19T12:00:00"))).toMatchObject({ ok: true, category: "adulto" });
  });
  test("calcula edad y rechaza nacimiento futuro", () => {
    expect(calculateAge("2030-01-01", new Date("2026-01-01"))).toMatchObject({ ok: false });
    expect(calculateAge("2000-01-01", new Date("2026-01-01"))).toMatchObject({ ok: true, age: 26 });
  });
});

describe("Regla 2: horarios operativos", () => {
  test("acepta día laboral en intervalo permitido", () => {
    expect(validateOperatingHours("2099-10-19T09:00:00")).toMatchObject({ ok: true });
  });
  test("rechaza fin de semana", () => {
    expect(validateOperatingHours("2099-10-18T09:00:00")).toMatchObject({ ok: false });
  });
  test("rechaza hora fuera de horario", () => {
    expect(validateOperatingHours("2099-10-19T07:30:00")).toMatchObject({ ok: false });
  });
  test("rechaza intervalo no alineado a 30 minutos", () => {
    expect(validateOperatingHours("2099-10-19T09:15:00")).toMatchObject({ ok: false });
  });
  test("rechaza fecha pasada", () => {
    expect(validateOperatingHours("2000-10-19T09:00:00")).toMatchObject({ ok: false });
  });
});

describe("Regla 3: choque de citas", () => {
  const appointments = [
    { doctorId: "MED-001", startAt: "2099-10-19T09:00:00.000Z", status: "reservada" },
    { doctorId: "MED-001", startAt: "2099-10-19T10:00:00.000Z", status: "cancelada" }
  ];
  test("detecta mismo médico y mismo horario activo", () => {
    expect(hasAppointmentConflict(appointments, "MED-001", "2099-10-19T09:00:00.000Z")).toBe(true);
  });
  test("no detecta conflicto para otro médico", () => {
    expect(hasAppointmentConflict(appointments, "MED-002", "2099-10-19T09:00:00.000Z")).toBe(false);
  });
  test("ignora cita cancelada", () => {
    expect(hasAppointmentConflict(appointments, "MED-001", "2099-10-19T10:00:00.000Z")).toBe(false);
  });
  test("rechaza entrada que no sea arreglo", () => {
    expect(() => hasAppointmentConflict(null, "MED-001", "2099-10-19T09:00:00.000Z")).toThrow(TypeError);
  });
});

describe("Regla 4: penalización por cancelación tardía", () => {
  const appointment = "2099-10-20T12:00:00.000Z";
  test("cancelación con más de 24 horas no penaliza", () => {
    expect(calculateCancellationPenalty(appointment, "2099-10-19T10:00:00.000Z", false)).toMatchObject({ ok: true, fee: 0, late: false });
  });
  test("cancelación con menos de 24 horas penaliza si no hay emergencia", () => {
    expect(calculateCancellationPenalty(appointment, "2099-10-20T00:00:00.000Z", false)).toMatchObject({ ok: true, fee: 25, late: true });
  });
  test("emergencia exime de penalización", () => {
    expect(calculateCancellationPenalty(appointment, "2099-10-20T00:00:00.000Z", true)).toMatchObject({ ok: true, fee: 0, late: true });
  });
  test("rechaza indicador de emergencia no booleano", () => {
    expect(calculateCancellationPenalty(appointment, "2099-10-20T00:00:00.000Z", "sí")).toMatchObject({ ok: false });
  });
  test("rechaza fechas inválidas y cancelación posterior a la cita", () => {
    expect(calculateCancellationPenalty("x", "y", false)).toMatchObject({ ok: false });
    expect(calculateCancellationPenalty("2020-01-01T00:00:00Z", "2020-01-02T00:00:00Z", false)).toMatchObject({ ok: false });
  });
});
