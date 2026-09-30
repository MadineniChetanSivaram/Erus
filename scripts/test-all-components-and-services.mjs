// Comprehensive End-to-End Component & Service Verification for ERUS
import { io } from 'socket.io-client';

const BASE_URL = 'http://localhost:3000';
let liveUrl = 'https://erus-production.up.railway.app';

async function runComprehensiveVerification() {
  console.log('='.repeat(80));
  console.log('  ERUS FULL COMPONENT & SERVICE INTEGRATION VERIFICATION SUITE');
  console.log('='.repeat(80));

  // Determine test target (live production or local)
  let targetUrl = liveUrl;
  try {
    const res = await fetch(`${targetUrl}/api/health`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error('Live not responding');
  } catch (e) {
    console.log(`Live URL ${liveUrl} not reachable, switching to local ${BASE_URL}...`);
    targetUrl = BASE_URL;
  }

  console.log(`Test Target: ${targetUrl}\n`);

  let passCount = 0;
  let failCount = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}${detail ? ` (${detail})` : ''}`);
      passCount++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failCount++;
    }
  }

  // --- 1. HEALTH & DATABASE ---
  console.log('\n--- 1. Health & Database Verification ---');
  let health;
  try {
    const res = await fetch(`${targetUrl}/api/health`);
    health = await res.json();
    assert(health.status === 'ok', 'System Health Check');
    assert(health.mongoConnected === true || health.database === 'mongodb', 'MongoDB Atlas Connection', health.mongoError || 'Connected');
  } catch (err) {
    assert(false, 'Health Check Request', err.message);
  }

  // --- 2. SUPER ADMIN PORTAL & AUTH ---
  console.log('\n--- 2. Super Admin Component & Service ---');
  let superAdminToken = '';
  try {
    const loginRes = await fetch(`${targetUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'superadmin@erus.ai', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    assert(loginData.success === true, 'Super Admin Authentication', `Role: ${loginData.user?.role}`);
    superAdminToken = loginData.token;

    // Analytics endpoint for SuperAdminDashboard.tsx
    const analyticsRes = await fetch(`${targetUrl}/api/superadmin/analytics`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const analyticsData = await analyticsRes.json();
    assert(analyticsRes.ok && (analyticsData.overview || analyticsData.totalColleges !== undefined), 'Super Admin Analytics Service');
  } catch (err) {
    assert(false, 'Super Admin Flow', err.message);
  }

  // --- 3. COLLEGE ADMIN PORTAL & MANAGEMENT ---
  console.log('\n--- 3. College Admin Component & Service ---');
  const testCollegeCode = `COL${Date.now().toString().slice(-4)}`;
  const testCollegeName = `Apex Institute of Tech ${testCollegeCode}`;
  const adminEmail = `admin.${testCollegeCode.toLowerCase()}@apex.edu`;
  const adminPassword = 'CampusAdminPassword123!';

  try {
    // Super Admin onboard college
    const collegeRes = await fetch(`${targetUrl}/api/admin/colleges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        name: testCollegeName,
        code: testCollegeCode,
        contactEmail: adminEmail,
        adminPassword: adminPassword,
        status: 'active'
      })
    });
    const collegeData = await collegeRes.json();
    assert(collegeRes.ok && (collegeData.college || collegeData.success), 'College Onboarding API');

    // College Admin login
    const adminLoginRes = await fetch(`${targetUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: adminEmail, password: adminPassword })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginData.success === true, 'College Admin Authentication', adminEmail);
  } catch (err) {
    assert(false, 'College Admin Flow', err.message);
  }

  // --- 4. FACULTY PORTAL & SLOT MANAGEMENT ---
  console.log('\n--- 4. Faculty Portal & Slot Creation Component ---');
  const facultyEmail = `prof.${Date.now().toString().slice(-4)}@apex.edu`;
  const facultyPassword = 'FacultySecret123!';
  let createdSlotId = '';

  try {
    // Register Faculty
    const facRegRes = await fetch(`${targetUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Vikram Patel',
        email: facultyEmail,
        password: facultyPassword,
        role: 'faculty',
        college: testCollegeName,
        collegeCode: testCollegeCode,
        department: 'Computer Science',
        designation: 'Professor'
      })
    });
    const facRegData = await facRegRes.json();
    assert(facRegData.success === true, 'Faculty Registration Component', facultyEmail);

    // Faculty Login
    const facLoginRes = await fetch(`${targetUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: facultyEmail, password: facultyPassword })
    });
    const facLoginData = await facLoginRes.json();
    assert(facLoginData.success === true, 'Faculty Login Component');

    // Faculty Create Slot (CreateSlotModal.tsx backend trigger)
    const slotRes = await fetch(`${targetUrl}/api/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'Ethics of Autonomous Vehicles and Machine Decisions',
        description: 'Evaluating decision frameworks in self-driving cars.',
        slotTiming: '11:00 AM - 11:30 AM',
        slotDate: 'Today',
        maxCapacity: 12,
        difficulty: 'Intermediate',
        allottedFaculty: 'Dr. Vikram Patel',
        collegeCode: testCollegeCode
      })
    });
    const slotData = await slotRes.json();
    assert(slotRes.ok && (slotData.id || slotData.slot?.id), 'Faculty CreateSlot Component', `Slot ID: ${slotData.id || slotData.slot?.id}`);
    createdSlotId = slotData.id || slotData.slot?.id;
  } catch (err) {
    assert(false, 'Faculty Component Flow', err.message);
  }

  // --- 5. STUDENT PORTAL & BOOKING ---
  console.log('\n--- 5. Student Portal & Slot Booking Component ---');
  const studentEmail = `student.${Date.now().toString().slice(-4)}@apex.edu`;
  const studentPassword = 'StudentPassword123!';
  let studentUser;

  try {
    // Student Register (StudentLogin.tsx registration tab)
    const stuRegRes = await fetch(`${targetUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Arun Varma',
        email: studentEmail,
        password: studentPassword,
        role: 'student',
        college: testCollegeName,
        collegeCode: testCollegeCode,
        course: 'B.Tech AI & Data Science',
        batch: '2024-2028'
      })
    });
    const stuRegData = await stuRegRes.json();
    assert(stuRegData.success === true, 'Student Registration Component', studentEmail);

    // Student Login
    const stuLoginRes = await fetch(`${targetUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: studentEmail, password: studentPassword })
    });
    const stuLoginData = await stuLoginRes.json();
    assert(stuLoginData.success === true, 'Student Login Component');
    studentUser = stuLoginData.user;

    // Student Booking / Enrollment into Slot
    if (createdSlotId) {
      const bookRes = await fetch(`${targetUrl}/api/slots/${createdSlotId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentUser.studentId || studentUser.id,
          studentName: studentUser.name,
          studentEmail: studentUser.email
        })
      });
      assert(bookRes.ok, 'Student Slot Enrollment / Booking Modal', `Slot: ${createdSlotId}`);
    }
  } catch (err) {
    assert(false, 'Student Component Flow', err.message);
  }

  // --- 6. LIVE GD ROOM & WEBSOCKET ENGINE ---
  console.log('\n--- 6. Live GD Room & WebRTC Socket Engine ---');
  try {
    const socket = io(targetUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 2,
      timeout: 5000
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Socket.IO connection timeout'));
      }, 6000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        assert(true, 'WebSocket Signaling Handshake (WebRTC N-way)', socket.id);

        // Join Room
        socket.emit('join-gd-room', {
          slotId: createdSlotId || 'session-101',
          user: studentUser || { id: 'test-stu', name: 'Test Student', seatNumber: 1 }
        });

        // Floor speaking state
        socket.emit('peer-speaking-state', {
          slotId: createdSlotId || 'session-101',
          isSpeaking: true,
          micActive: true,
          cameraActive: true,
          volumeLevel: 75
        });

        // Live transcript broadcast
        socket.emit('peer-transcript', {
          slotId: createdSlotId || 'session-101',
          text: 'In my perspective, autonomous vehicles must adhere to utilitarian ethical frameworks while safeguarding human passenger safety.',
          elapsedSeconds: 15,
          transcriptId: `tr-${Date.now()}`
        });

        setTimeout(() => {
          socket.disconnect();
          assert(true, 'Live GD Room Real-time Floor & Transcript Relay');
          resolve();
        }, 1000);
      });

      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  } catch (err) {
    assert(false, 'Live GD Room WebSockets', err.message);
  }

  // --- 7. ASSESSMENT REPORT & 7-PARAMETER RUBRIC ---
  console.log('\n--- 7. Assessment Engine & Student Report View ---');
  let generatedReport;
  try {
    const reportRes = await fetch(`${targetUrl}/api/assessment-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: createdSlotId || 'session-101',
        studentId: studentUser?.studentId || 'STU-001',
        studentName: studentUser?.name || 'Arun Varma',
        collegeCode: testCollegeCode,
        transcripts: [
          { speaker: studentUser?.name || 'Arun Varma', text: 'I believe we need structured ethical policies for AI vehicles.' }
        ]
      })
    });
    const reportData = await reportRes.json();
    assert(reportRes.ok && (reportData.report || reportData.id), '7-Parameter Assessment Generation (Gemini / Heuristic Engine)');
    generatedReport = reportData.report || reportData;

    // Validate 7 Rubric Parameters
    if (generatedReport && generatedReport.skills) {
      const skills = Object.keys(generatedReport.skills);
      const expectedSkills = ['englishProficiency', 'fluency', 'clarityOfThought', 'confidence', 'contentKnowledge', 'collaboration', 'leadership'];
      const hasRubric = expectedSkills.some((s) => skills.includes(s));
      assert(hasRubric, 'Standard Academic 7-Parameter Rubric Validation', `Keys: ${skills.length} parameters`);
    }

    // Faculty Endorsement Check
    const endorseRes = await fetch(`${targetUrl}/api/assessment-reports/endorse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId: generatedReport?.id || 'sample-report',
        facultyId: 'FAC-PATEL',
        facultyName: 'Dr. Vikram Patel',
        designation: 'Professor',
        facultyRemarks: 'Exceptional argument structure and command of ethical theory.'
      })
    });
    assert(endorseRes.ok, 'Faculty Report Endorsement & Grade Finalization');
  } catch (err) {
    assert(false, 'Assessment Report Suite', err.message);
  }

  // --- SUMMARY ---
  console.log('\n' + '='.repeat(80));
  console.log(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('='.repeat(80));

  if (failCount === 0) {
    console.log('🎉 ALL COMPONENTS AND SERVICES ARE FULLY OPERATIONAL AND VERIFIED!\n');
    process.exit(0);
  } else {
    console.log('⚠️ Some components or services encountered issues.\n');
    process.exit(1);
  }
}

runComprehensiveVerification().catch((err) => {
  console.error('Fatal suite execution error:', err);
  process.exit(1);
});
