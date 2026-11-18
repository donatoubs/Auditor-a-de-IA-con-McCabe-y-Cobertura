const express = require("express");
const path = require("path");
const { createDatabase } = require("./db");
const {
  validatePatientAge,
  validateOperatingHours,
  hasAppointmentConflict,
  calculateCancellationPenalty
} = require("./rules");

function createApp(options = {}) {
  const db = options.db || createDatabase(options.databaseFile);
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "..", "public")));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.get("/api/appointments", (_req, res) => {
    const rows = db.prepare("SELECT * FROM appointments ORDER BY start_at ASC").all();
    res.json(rows);
  });

  app.post("/api/appointments", (req, res) => {
    const {
      patientName, dateOfBirth, guardianName = "",
      doctorId, startAt, isEmergency = false
    } = req.body || {};

    if (![patientName, dateOfBirth, doctorId, startAt].every((v) => typeof v === "string" && v.trim())) {
      return res.status(400).json({ error: "Nombre del paciente, fecha de nacimiento, médico y fecha de cita son obligatorios." });
    }
    if (typeof isEmergency !== "boolean") {
      return res.status(400).json({ error: "El indicador de emergencia debe ser booleano." });
    }

    const patient = validatePatientAge(dateOfBirth, guardianName);
    if (!patient.ok) return res.status(400).json({ error: patient.error, rule: "edad" });

    const schedule = validateOperatingHours(startAt);
    if (!schedule.ok) return res.status(400).json({ error: schedule.error, rule: "horario" });

    const existing = db.prepare(
      "SELECT doctor_id AS doctorId, start_at AS startAt, status FROM appointments WHERE doctor_id = ?"
    ).all(doctorId);
    if (hasAppointmentConflict(existing, doctorId, startAt)) {
      return res.status(409).json({ error: "El médico ya tiene una cita reservada en ese horario.", rule: "choque" });
    }

    const result = db.prepare(`
      INSERT INTO appointments
      (patient_name, date_of_birth, guardian_name, doctor_id, start_at, is_emergency)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(patientName.trim(), dateOfBirth, guardianName.trim(), doctorId.trim(), new Date(startAt).toISOString(), isEmergency ? 1 : 0);

    return res.status(201).json({
      id: result.lastInsertRowid,
      message: "Cita reservada correctamente.",
      patientCategory: patient.category
    });
  });

  app.post("/api/appointments/:id/cancel", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Identificador de cita inválido." });
    const appointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id);
    if (!appointment) return res.status(404).json({ error: "No se encontró la cita." });
    if (appointment.status === "cancelada") return res.status(409).json({ error: "La cita ya está cancelada." });

    const isEmergency = req.body?.isEmergency ?? Boolean(appointment.is_emergency);
    const penalty = calculateCancellationPenalty(appointment.start_at, new Date().toISOString(), isEmergency);
    if (!penalty.ok) return res.status(400).json({ error: penalty.error });

    db.prepare("UPDATE appointments SET status = 'cancelada', cancellation_fee = ? WHERE id = ?")
      .run(penalty.fee, id);
    return res.json({
      message: "Cita cancelada.",
      lateCancellation: penalty.late,
      penalty: penalty.fee
    });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor." });
  });

  app.locals.db = db;
  return app;
}

module.exports = { createApp };
