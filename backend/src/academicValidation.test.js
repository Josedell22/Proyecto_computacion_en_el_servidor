const assert = require("node:assert/strict");
const test = require("node:test");
const {
  parseDateBoundary,
  parseFutureDate,
  parsePositiveId,
  validateAvailabilitySlot,
} = require("./academicValidation");

test("accepts positive integer identifiers only", () => {
  assert.equal(parsePositiveId("12"), 12);
  assert.equal(parsePositiveId(0), null);
  assert.equal(parsePositiveId("1.5"), null);
  assert.equal(parsePositiveId("not-an-id"), null);
  for (const value of [true, [1], {}, "2147483648"]) assert.equal(parsePositiveId(value), null);
});

test("requires a valid current or future preferred date", () => {
  const now = new Date("2026-11-07T15:00:00.000Z");
  assert.ok(parseFutureDate("2026-11-07T15:00:00.000Z", now).value);
  assert.ok(parseFutureDate("2026-11-08T15:00:00.000Z", now).value);
  assert.match(parseFutureDate("2026-11-06T15:00:00.000Z", now).error, /posterior/);
  assert.match(parseFutureDate("invalid", now).error, /válida/);
  assert.match(parseFutureDate("", now).error, /obligatoria/);
  for (const value of ["2030-02-30T12:00:00Z", "2030-01-01T12:00", true, [2030]]) {
    assert.ok(parseFutureDate(value, now).error);
  }
});

test("validates availability day, time format and ordering", () => {
  assert.deepEqual(
    validateAvailabilitySlot({ weekday: "1", startTime: "14:00", endTime: "16:00" }).value,
    { weekday: 1, startTime: "14:00", endTime: "16:00" }
  );
  assert.match(validateAvailabilitySlot({ weekday: 7, startTime: "14:00", endTime: "16:00" }).error, /día/);
  assert.match(validateAvailabilitySlot({ weekday: 1, startTime: "16:00", endTime: "14:00" }).error, /posterior/);
  assert.match(validateAvailabilitySlot({ weekday: 1, startTime: "xx", endTime: "14:00" }).error, /válidas/);
  for (const weekday of [null, undefined, "", true, 1.5]) assert.ok(validateAvailabilitySlot({ weekday, startTime: "14:00", endTime: "16:00" }).error);
  assert.ok(validateAvailabilitySlot({ weekday: 1, startTime: "14:00", endTime: "14:00:00" }).error);
});

test("parses Colombian day boundaries for history filters", () => {
  assert.equal(parseDateBoundary("2026-11-07").value.toISOString(), "2026-11-07T05:00:00.000Z");
  assert.equal(parseDateBoundary("2026-11-07", true).value.toISOString(), "2026-11-08T04:59:59.999Z");
  assert.match(parseDateBoundary("07/11/2026").error, /formato/);
  assert.ok(parseDateBoundary("2026-02-30").error);
  assert.ok(parseDateBoundary(["2026-11-07"]).error);
});
