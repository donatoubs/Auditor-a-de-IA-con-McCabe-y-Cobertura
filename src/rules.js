const {
  PEDIATRIC_MAX_AGE,
  MIN_ADULT_AGE,
  OPEN_HOUR,
  CLOSE_HOUR,
  SLOT_MINUTES,
  LATE_CANCELLATION_HOURS,
  CANCELLATION_FEE
} = require("./config");

function calculateAge(birthDate, today = new Date()) {
  if (typeof birthDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return { ok: false };
  }

  const [year, month, day] = birthDate.split("-").map(Number);

  const birth = new Date(Date.UTC(year, month - 1, day));

  // Rechazar fechas inexistentes, como 2000-02-30
  if (
    birth.getUTCFullYear() !== year ||
    birth.getUTCMonth() !== month - 1 ||
    birth.getUTCDate() !== day
  ) {
    return { ok: false };
  }

  const current = new Date(Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ));

  if (birth > current) {
    return { ok: false };
  }

  let age = current.getUTCFullYear() - year;

  const birthdayNotReached =
    current.getUTCMonth() < month - 1 ||
    (current.getUTCMonth() === month - 1 &&
      current.getUTCDate() < day);

  if (birthdayNotReached) {
    age--;
  }

  return { ok: true, age };
}

function validatePatientAge(dateOfBirth, guardianName, referenceDate = new Date()) {
  const ageResult = calculateAge(dateOfBirth, referenceDate);
  if (!ageResult.ok) return ageResult;

  const { age } = ageResult;
  if (age <= PEDIATRIC_MAX_AGE) {
    if (typeof guardianName !== "string" || guardianName.trim().length === 0) {
      return { ok: false, error: "Los pacientes pediátricos (0–17 años) deben registrar un representante." };
    }
    return { ok: true, age, category: "pediatrico" };
  }
  if (age >= MIN_ADULT_AGE) {
    return { ok: true, age, category: "adulto" };
  }
  return { ok: false, error: "La edad del paciente no cumple las reglas del sistema." };
}

function validateOperatingHours(startAt) {
  if (typeof startAt !== "string" || Number.isNaN(Date.parse(startAt))) {
    return { ok: false, error: "La fecha y hora de la cita no son válidas." };
  }
  const date = new Date(startAt);
  const day = date.getDay();
  const minutes = date.getHours() * 60 + date.getMinutes();
  const opening = OPEN_HOUR * 60;
  const closing = CLOSE_HOUR * 60;
  if (day === 0 || day === 6) {
    return { ok: false, error: "No se atienden citas los fines de semana." };
  }
  if (minutes < opening || minutes + SLOT_MINUTES > closing) {
    return { ok: false, error: "La cita debe estar dentro del horario de lunes a viernes, de 08:00 a 17:00." };
  }
  if (date.getMinutes() % SLOT_MINUTES !== 0 || date.getSeconds() !== 0 || date.getMilliseconds() !== 0) {
    return { ok: false, error: "Las citas deben comenzar en intervalos de 30 minutos." };
  }
  if (date <= new Date()) {
    return { ok: false, error: "La cita debe programarse en el futuro." };
  }
  return { ok: true };
}

function hasAppointmentConflict(existingAppointments, doctorId, startAt) {
  if (!Array.isArray(existingAppointments)) {
    throw new TypeError("existingAppointments debe ser un arreglo.");
  }
  return existingAppointments.some((appointment) =>
    String(appointment.doctorId) === String(doctorId) &&
    new Date(appointment.startAt).getTime() === new Date(startAt).getTime() &&
    appointment.status !== "cancelada"
  );
}

function calculateCancellationPenalty(startAt, cancelledAt, isEmergency) {
  if (typeof isEmergency !== "boolean") {
    return { ok: false, error: "El indicador de emergencia debe ser booleano." };
  }
  const appointmentTime = Date.parse(startAt);
  const cancellationTime = Date.parse(cancelledAt);
  if (Number.isNaN(appointmentTime) || Number.isNaN(cancellationTime)) {
    return { ok: false, error: "Las fechas de cita o cancelación no son válidas." };
  }
  const hoursUntilAppointment = (appointmentTime - cancellationTime) / (1000 * 60 * 60);
  if (hoursUntilAppointment < 0) {
    return { ok: false, error: "No se puede cancelar una cita en el pasado." };
  }
  const isLate = hoursUntilAppointment < LATE_CANCELLATION_HOURS;
  // La excepción de emergencia exime de penalización.
  if (isLate && !isEmergency) {
    return { ok: true, fee: CANCELLATION_FEE, late: true };
  }
  return { ok: true, fee: 0, late: isLate };
}

module.exports = {
  calculateAge,
  validatePatientAge,
  validateOperatingHours,
  hasAppointmentConflict,
  calculateCancellationPenalty
};
