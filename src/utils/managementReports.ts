/**
 * ERUS Management Reports & Export Utility
 * Provides downloadable structured reports across all 4 tiers:
 * 1. Super Admin
 * 2. College Admin
 * 3. Class Teacher / Faculty
 * 4. Student
 */

export function downloadCSVReport(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 1. SUPER ADMIN REPORTS
export function downloadSuperAdminReport(reportType: 'all_college' | 'comparison' | 'skill_gap' | 'monthly' | 'effectiveness') {
  switch (reportType) {
    case 'all_college':
      downloadCSVReport('ERUS_All_Colleges_Platform_Report', 
        ['College Name', 'College Code', 'Total Enrolled Students', 'GD Sessions Conducted', 'Participation Rate (%)', 'Average GD Score (%)', 'Avg Speaking Time (min)', 'Improvement Rate (%)'],
        [
          ['Delhi Institute of Technology', 'DIT', 2500, 420, '86%', '72%', '4.2 min', '+14%'],
          ['BMS Institute of Technology', 'BMSIT', 1800, 350, '79%', '68%', '3.8 min', '+11%'],
          ['National Institute of Engineering', 'NIE', 3100, 510, '91%', '76%', '4.5 min', '+17%'],
          ['RV College of Engineering', 'RVCE', 2800, 480, '88%', '74%', '4.3 min', '+15%'],
          ['PES University Central Campus', 'PESU', 3400, 560, '93%', '77%', '4.6 min', '+18%'],
        ]
      );
      break;

    case 'comparison':
      downloadCSVReport('ERUS_Institutional_Comparative_Benchmark',
        ['Institution', 'Cohort Size', 'Participation %', 'Avg Communication Score', 'Avg Critical Thinking', 'Placement Readiness %', 'Growth Delta'],
        [
          ['Delhi Institute of Technology', 2500, '86%', '74%', '78%', '75%', '+14%'],
          ['BMS Institute of Technology', 1800, '79%', '70%', '72%', '69%', '+11%'],
          ['National Institute of Engineering', 3100, '91%', '78%', '81%', '80%', '+17%'],
          ['RV College of Engineering', 2800, '88%', '76%', '79%', '77%', '+15%'],
        ]
      );
      break;

    case 'skill_gap':
      downloadCSVReport('ERUS_Platform_Wide_Skill_Gap_Analysis',
        ['Skill / Competency Area', 'Deficiency Prevalence (%)', 'Key Behavioral Indicator', 'Target Curriculum Recommendation'],
        [
          ['Speaking Duration', '42%', 'Candidate speaks for less than 60 seconds total', 'Timed monologue practice sessions & opening statement drills'],
          ['Turn Taking & Entry', '36%', 'Difficulty entering an ongoing discussion naturally', 'Interruption etiquette & polite interjection prompts'],
          ['Summarization & Synthesis', '31%', 'Weak conclusion or missing wrap-up statements', 'Framework for two-point consensus summary generation'],
          ['Content Depth', '28%', 'Frequently repeats points already raised by peers', 'Lateral thinking and opposing perspective ideation'],
          ['Grammar & Syntax', '24%', 'Grammar-related agreement and tense errors', 'Automated language precision and vocabulary exercises'],
          ['Pronunciation & Clarity', '19%', 'Unclear articulation or pronunciation ambiguity', 'Voice modulation and phonetic audio training modules'],
        ]
      );
      break;

    case 'monthly':
      downloadCSVReport('ERUS_Monthly_Platform_Growth_Report',
        ['Month', 'Active Colleges', 'Active Students', 'Sessions Completed', 'Avg Score', 'Speaking Volume (Hours)'],
        [
          ['October 2026', 14, 13600, 2320, '74%', '1,840 hrs'],
          ['September 2026', 12, 11400, 1890, '71%', '1,490 hrs'],
          ['August 2026', 10, 8900, 1420, '68%', '1,120 hrs'],
          ['July 2026', 8, 6200, 980, '65%', '780 hrs'],
        ]
      );
      break;

    case 'effectiveness':
      downloadCSVReport('ERUS_Program_Effectiveness_Audit',
        ['Evaluation Parameter', 'Baseline Score (Month 1)', 'Current Score (Month 4)', 'Net Improvement', 'Statistical Significance'],
        [
          ['Fluency & Flow', '58%', '78%', '+20% gain', 'p < 0.001 (High)'],
          ['Clarity of Expression', '61%', '82%', '+21% gain', 'p < 0.001 (High)'],
          ['Critical Argumentation', '56%', '76%', '+20% gain', 'p < 0.001 (High)'],
          ['Confidence Under Pressure', '59%', '83%', '+24% gain', 'p < 0.001 (High)'],
          ['Team Collaboration', '62%', '79%', '+17% gain', 'p < 0.001 (High)'],
        ]
      );
      break;
  }
}

// 2. COLLEGE ADMIN REPORTS
export function downloadCollegeAdminReport(collegeName: string, reportType: 'performance' | 'department' | 'class' | 'participation' | 'readiness') {
  const college = collegeName || 'Academic Institution';

  switch (reportType) {
    case 'performance':
      downloadCSVReport(`${college}_Institutional_Performance_Report`,
        ['Metric', 'Current Value', 'Target Benchmark', 'Status', 'Quarterly Growth'],
        [
          ['Enrolled Student Base', '4,850', '4,500', 'Exceeded', '+8%'],
          ['Active Participating Students', '4,120', '4,000', 'Exceeded', '+12%'],
          ['Total Discussion Sessions', '1,260', '1,000', 'Exceeded', '+26%'],
          ['Institutional Participation Rate', '84%', '80%', 'Achieved', '+7%'],
          ['Average Evaluation Score', '71%', '70%', 'Achieved', '+5%'],
          ['Overall Improvement Delta', '+16%', '+12%', 'Exceeded', '+4%'],
        ]
      );
      break;

    case 'department':
      downloadCSVReport(`${college}_Department_Wise_Analytics`,
        ['Department', 'Students Enrolled', 'Participation Rate (%)', 'Average Score (%)', 'Growth / Improvement (%)', 'Intervention Urgency'],
        [
          ['Computer Science & Engineering (CSE)', 620, '92%', '78%', '+18%', 'Low - On Track'],
          ['Electronics & Communication (ECE)', 480, '86%', '73%', '+15%', 'Low - On Track'],
          ['Electrical & Electronics (EEE)', 350, '81%', '68%', '+12%', 'Moderate - Coaching Recommended'],
          ['Mechanical Engineering (MECH)', 410, '75%', '64%', '+10%', 'High - Additional GD Slots Required'],
          ['Civil Engineering (CIVIL)', 290, '72%', '62%', '+9%', 'High - Speaking Remediation Needed'],
        ]
      );
      break;

    case 'class':
      downloadCSVReport(`${college}_Class_Wise_Drilldown_Report`,
        ['Department', 'Year', 'Section', 'Total Students', 'Participated', 'Participation %', 'Avg Score %', 'Avg Speaking Time', 'Need Practice'],
        [
          ['CSE', '3rd Year', 'Section A', 62, 55, '89%', '76%', '3:42 min', 17],
          ['CSE', '3rd Year', 'Section B', 60, 52, '87%', '74%', '3:28 min', 19],
          ['CSE', '4th Year', 'Section A', 58, 56, '96%', '81%', '4:15 min', 8],
          ['ECE', '3rd Year', 'Section A', 55, 47, '85%', '72%', '3:12 min', 21],
          ['ECE', '3rd Year', 'Section B', 54, 45, '83%', '71%', '3:05 min', 22],
          ['MECH', '3rd Year', 'Section A', 50, 36, '72%', '63%', '2:30 min', 28],
        ]
      );
      break;

    case 'participation':
      downloadCSVReport(`${college}_Student_Attendance_Engagement_Report`,
        ['Category', 'Count', 'Percentage of Total', 'Recommended Action Plan'],
        [
          ['Registered Students', '4,850', '100%', 'Institutional enrolled roster base'],
          ['Active Students (Completed >= 1 GD)', '4,120', '85%', 'Maintain regular weekly practice schedule'],
          ['Students Who Never Participated', '730', '15%', 'Send automated credentials reminder & mandate slot'],
          ['Students With Low Participation (< 2 GDs)', '890', '18%', 'Assign dedicated faculty slot observer'],
          ['Average GDs Attempted per Student', '4.2 GDs', '-', 'Target: Minimum 5 GD sessions before placements'],
        ]
      );
      break;

    case 'readiness':
      downloadCSVReport(`${college}_Placement_GD_Readiness_Index`,
        ['Competency Parameter', 'Campus Average (%)', 'Industry Hire Benchmark (%)', 'Readiness Status', 'Placement Tier Target'],
        [
          ['Communication Clarity', '78%', '75%', 'Ready', 'Tier-1 Product & IT Services'],
          ['Spoken Fluency', '72%', '70%', 'Ready', 'Core & Consulting Roles'],
          ['Vocabulary Range', '75%', '70%', 'Ready', 'Global Tech Teams'],
          ['Critical Thinking & Logic', '81%', '75%', 'Strong', 'Strategy & Engineering Design'],
          ['Leadership & Moderation', '68%', '65%', 'Moderate', 'Team Lead Potential'],
          ['Active Listening & Courtesy', '73%', '70%', 'Ready', 'Client-Facing Engagements'],
          ['Assertive Confidence', '76%', '72%', 'Ready', 'Executive Interaction'],
          ['OVERALL GD READINESS INDEX', '75%', '70%', 'HIGH PLACEMENT READINESS', 'Eligible for Corporate Drives'],
        ]
      );
      break;
  }
}

// 3. TEACHER / FACULTY REPORTS
export function downloadFacultyReport(facultyName: string, reportType: 'class' | 'assessment' | 'intervention' | 'activity') {
  const name = facultyName || 'Faculty Observer';

  switch (reportType) {
    case 'class':
      downloadCSVReport(`Faculty_${name}_Class_Performance_Report`,
        ['Batch / Section', 'Subject / Lab', 'Enrolled Candidates', 'Assessed in GD', 'Avg Class Score (%)', 'Avg Fluency', 'Avg Confidence'],
        [
          ['CSE 3rd Year - Sec A', 'Advanced Placement Training', 32, 29, '76%', '74%', '78%'],
          ['CSE 3rd Year - Sec B', 'Soft Skills & Communication', 30, 28, '72%', '70%', '75%'],
          ['ECE 3rd Year - Sec A', 'Professional Ethics & Debate', 28, 26, '74%', '71%', '76%'],
        ]
      );
      break;

    case 'assessment':
      downloadCSVReport(`Faculty_${name}_Student_Assessment_Matrix`,
        ['Seat #', 'Candidate Name', 'Roll Number', 'Speaking Time', 'Contributions', 'Relevance', 'Fluency', 'Confidence', 'Final Score', 'Teacher Score'],
        [
          [1, 'Aarav Sharma', 'STU-2024-101', '4:32 min', 7, 86, 82, 88, 85, 87],
          [2, 'Ishita Patel', 'STU-2024-102', '3:15 min', 5, 80, 78, 82, 79, 80],
          [3, 'Rohan Gupta', 'STU-2024-103', '1:48 min', 3, 72, 68, 61, 67, 68],
          [4, 'Ananya Deshmukh', 'STU-2024-104', '3:50 min', 6, 84, 80, 85, 83, 84],
          [5, 'Karan Verma', 'STU-2024-105', '0:42 min', 1, 70, 75, 52, 63, 62],
          [6, 'Divya Nair', 'STU-2024-106', '2:40 min', 4, 76, 74, 78, 75, 76],
        ]
      );
      break;

    case 'intervention':
      downloadCSVReport(`Faculty_${name}_Student_Intervention_Flags`,
        ['Category Flag', 'Candidate Name', 'Specific Diagnostic Observation', 'Actionable Teacher Intervention'],
        [
          ['Needs Immediate Practice', 'Karan Verma', 'Speaking time < 60s, very low participation frequency', 'Call on candidate directly for opening statement in next GD'],
          ['Needs Immediate Practice', 'Rohan Gupta', 'Weak pronunciation and hesitant phrase transitions', 'Assign 5-minute audio shadowing drills on platform'],
          ['Needs Immediate Practice', 'Vikram Malhotra', 'Difficulty organizing thoughts into cohesive arguments', 'Guide through PREP framework (Point-Reason-Example-Point)'],
          ['Needs Improvement', 'Sneha Rao', 'Repetitive arguments without introducing novel evidence', 'Challenge candidate to provide quantitative case examples'],
          ['Needs Improvement', 'Arjun Mehta', 'Weak concluding remarks and rushed wrap-up', 'Designate as closing speaker for concluding consensus'],
          ['Good Progress', 'Aarav Sharma', 'Exceptional fluency, assertive poise, and empathy for peers', 'Promote to advanced competitive debate rounds'],
        ]
      );
      break;

    case 'activity':
      downloadCSVReport(`Faculty_${name}_GD_Activity_Log`,
        ['Session Date', 'Slot Name', 'Discussion Topic', 'Duration', 'Candidates Present', 'Status', 'Evaluations Submitted'],
        [
          ['Today', 'Slot 1: CSE Round', 'Will AI Create More Jobs Than It Replaces?', '15 min', 15, 'Completed', 15],
          ['Today', 'Slot 2: Placement Mock', 'Electric Vehicles vs Hydrogen Fuel Cells', '15 min', 15, 'Completed', 15],
          ['Yesterday', 'Slot 3: Engineering Screening', 'Data Privacy vs National Security', '15 min', 14, 'Completed', 14],
        ]
      );
      break;
  }
}

// 4. STUDENT REPORTS
export function downloadStudentReport(studentName: string, reportType: 'performance' | 'history' | 'skill' | 'improvement' | 'readiness') {
  const name = studentName || 'Candidate';

  switch (reportType) {
    case 'performance':
      downloadCSVReport(`${name}_Comprehensive_Performance_Profile`,
        ['Evaluation Parameter', 'Student Score', 'Cohort Average', 'Benchmark Status', 'AI Feedback Note'],
        [
          ['Overall GD Performance Score', '78 / 100', '71 / 100', 'Top 15%', 'Consistently articulates logical points with poise'],
          ['Speaking Fluency', '78 / 100', '70 / 100', 'Above Average', 'Maintains natural flow with minimal speech hesitation'],
          ['Communication Clarity', '82 / 100', '73 / 100', 'Excellent', 'Expresses perspective with sharp, articulate structure'],
          ['Vocabulary Range', '74 / 100', '68 / 100', 'Proficient', 'Effective use of professional academic terminology'],
          ['Grammar Precision', '71 / 100', '69 / 100', 'Good', 'Accurate sentence structure with minor tense variations'],
          ['Phonetic Pronunciation', '80 / 100', '72 / 100', 'Very Good', 'Crisp phonetics aligned with global English standards'],
          ['Speaking Confidence', '83 / 100', '72 / 100', 'High', 'Assertive delivery with calm, professional posture'],
          ['Critical Thinking', '76 / 100', '68 / 100', 'Strong', 'Substantiates arguments with logic and real-world examples'],
          ['Active Listening', '69 / 100', '66 / 100', 'Satisfactory', 'Listens actively but can build more on peer arguments'],
          ['Leadership & Teamwork', '72 / 100', '65 / 100', 'Good', 'Helps maintain calm consensus and respectful dialogue'],
        ]
      );
      break;

    case 'history':
      downloadCSVReport(`${name}_My_GD_Journey_Historical_Log`,
        ['Date', 'Discussion Topic', 'Duration', 'Overall Score', 'Participation Level', 'Key Behavioral Improvement'],
        [
          ['05 Aug 2026', 'AI & Jobs in Tech', '15 min', 62, 'Low', 'Spoken Fluency and sentence linking'],
          ['12 Aug 2026', 'Social Media Algorithms & Privacy', '18 min', 67, 'Medium', 'Voice modulation and assertive confidence'],
          ['19 Aug 2026', 'Higher Education vs Skill Bootcamps', '20 min', 72, 'Good', 'Domain vocabulary and case examples'],
          ['26 Aug 2026', 'Future of Remote Work in IT', '20 min', 78, 'Very Good', 'Constructive leadership and consensus building'],
        ]
      );
      break;

    case 'skill':
      downloadCSVReport(`${name}_Skill_Development_Radar_Data`,
        ['Skill Dimension', 'Score (out of 100)', 'Proficiency Level', 'Development Recommendation'],
        [
          ['Fluency', 78, 'Advanced', 'Practice uninterrupted 2-minute extempore speaking'],
          ['Clarity', 82, 'Mastery', 'Maintain structured opening and conclusion statements'],
          ['Vocabulary', 74, 'Proficient', 'Incorporate industry-specific corporate terminology'],
          ['Grammar', 71, 'Proficient', 'Refine subject-verb agreement in rapid speech'],
          ['Pronunciation', 80, 'Advanced', 'Focus on crisp vowel elongation in complex words'],
          ['Confidence', 83, 'Mastery', 'Excellent vocal projection and body language'],
          ['Critical Thinking', 76, 'Advanced', 'Formulate counter-arguments before speaking'],
          ['Listening', 69, 'Developing', 'Explicitly cite peer names when responding'],
          ['Leadership', 72, 'Proficient', 'Guide the group toward final synthesis in the last 2 minutes'],
        ]
      );
      break;

    case 'improvement':
      downloadCSVReport(`${name}_Month_Over_Month_Improvement_Audit`,
        ['Timeline Milestone', 'Score', 'Net Gain', 'Key Breakthrough'],
        [
          ['Month 1 (Baseline Assessment)', 58, 'Baseline', 'Participated for 1 minute with hesitation'],
          ['Month 2 (Session 3-5)', 66, '+8 Points', 'Overcame fear of interjection in group debate'],
          ['Month 3 (Session 6-8)', 74, '+8 Points', 'Incorporated structured 3-part argumentation'],
          ['Month 4 (Current Standing)', 78, '+4 Points', 'Achieved top 15% placement readiness ranking (+20 Total Gain)'],
        ]
      );
      break;

    case 'readiness':
      downloadCSVReport(`${name}_Corporate_Placement_Readiness_Certificate`,
        ['Parameter', 'Result', 'Verification Status'],
        [
          ['Candidate Name', name, 'Verified via Institutional ID'],
          ['Overall Placement Readiness Index', '78 / 100', 'CERTIFIED READY FOR CORPORATE RECRUITMENT'],
          ['Recommended Interview Track', 'Software Engineering / Technical Consulting', 'High Aptitude Match'],
          ['Communication Rank in Cohort', 'Top 15th Percentile', 'Verified by ERUS AI Engine'],
          ['Accreditation Body', 'ERUS Autonomous AI Group Discussion Evaluator', 'Authentic Assessment Record'],
        ]
      );
      break;
  }
}
