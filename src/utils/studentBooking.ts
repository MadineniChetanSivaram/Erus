/**
 * Student Slot Booking Manager:
 * Enforces the Single Slot Policy (PDF Page 5, FR-2).
 * Once a student books/registers for a slot, they cannot book or select any other slot.
 */

const STORAGE_PREFIX = 'erus_student_booked_slot_';

export function getStudentBookedSlotId(studentIdentifier?: string | null): string | null {
  if (!studentIdentifier) return null;
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${studentIdentifier}`) || null;
  } catch {
    return null;
  }
}

export function setStudentBookedSlotId(studentIdentifier: string, slotId: string): void {
  if (!studentIdentifier || !slotId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${studentIdentifier}`, slotId);
  } catch {}

  // Sync with backend API
  try {
    fetch('/api/student/book-slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: studentIdentifier, slotId }),
    }).catch((err) => console.warn('[Student Slot Booking Sync Notice]:', err));
  } catch {}
}

export function isSlotSelectableForStudent(
  slotId: string,
  userRole?: string | null,
  studentIdentifier?: string | null,
  currentBookedSlotId?: string | null
): { allowed: boolean; reason?: string } {
  // Faculty, College Admin, and Super Admin are observers/evaluators and can view all slots
  if (userRole !== 'student') {
    return { allowed: true };
  }

  const booked = currentBookedSlotId || getStudentBookedSlotId(studentIdentifier);
  if (!booked) {
    // Has not booked yet; free to book any open slot
    return { allowed: true };
  }

  if (booked === slotId) {
    // This is the student's confirmed booked slot
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'You have already booked your seat in another slot. Institutional policy restricts students to one GD slot.',
  };
}
