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

export function clearStudentBookedSlot(studentIdentifier?: string | null): void {
  if (!studentIdentifier) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${studentIdentifier}`);
  } catch {}

  // Sync with backend API
  try {
    fetch('/api/student/cancel-slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: studentIdentifier }),
    }).catch((err) => console.warn('[Student Slot Cancel Sync Notice]:', err));
  } catch {}
}

export function checkCanReviveSlot(slot: { slotTiming?: string; slotDate?: string; status?: string }): {
  canRevive: boolean;
  minutesRemaining?: number;
  reason?: string;
} {
  if (slot.status === 'completed') {
    return { canRevive: false, reason: 'This discussion session has already concluded and been evaluated.' };
  }
  if (slot.status === 'active') {
    return { canRevive: false, reason: 'This discussion session is currently live in progress.' };
  }

  // Parse time from slotTiming, e.g. "09:30 AM - 10:00 AM" or "02:30 PM - 03:00 PM"
  if (!slot.slotTiming) {
    return { canRevive: true };
  }

  try {
    const timeMatch = slot.slotTiming.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      const now = new Date();
      const slotStartTime = new Date();
      slotStartTime.setHours(hours, minutes, 0, 0);

      if (slot.slotDate && slot.slotDate.toLowerCase().includes('tomorrow')) {
        slotStartTime.setDate(slotStartTime.getDate() + 1);
      }

      const diffMs = slotStartTime.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);

      // In a prototype/demo environment:
      // If time has passed today, assume it is for an upcoming demo run > 1 hr away unless explicitly in active/completed
      if (diffMinutes < 0) {
        return { canRevive: true, minutesRemaining: 150 };
      }

      if (diffMinutes <= 60) {
        return {
          canRevive: false,
          minutesRemaining: Math.max(1, diffMinutes),
          reason: `Slot starts in ${diffMinutes} minute(s). Under institutional policy, bookings are locked and cannot be revived within 1 hour of slot start time.`,
        };
      }

      return {
        canRevive: true,
        minutesRemaining: diffMinutes,
      };
    }
  } catch (err) {
    console.warn('[checkCanReviveSlot error]:', err);
  }

  return { canRevive: true };
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
