const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
function parseIdList(val) {
  if (val === null || val === undefined || val === '' || val === 'all') return [];
  if (Array.isArray(val)) {
    return val.flatMap(v => parseIdList(v));
  }
  if (typeof val === 'string') {
    return val.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
  }
  const n = Number(val);
  return (!isNaN(n) && n > 0) ? [n] : [];
}

function parseStringList(val) {
  if (val === null || val === undefined || val === '' || val === 'all') return [];
  if (Array.isArray(val)) {
    return val.flatMap(v => parseStringList(v));
  }
  if (typeof val === 'string') {
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  const s = String(val).trim();
  return s ? [s] : [];
}


class SDMSService {
  constructor() {
    this.pool = null;
    this.catalogCache = null;
    this.catalogCacheTime = 0;
  }

  getPool() {
    if (!this.pool) {
      if (!env.DB_HOST || !env.DB_USER) {
        throw new Error('SDMS MySQL database configuration is missing');
      }

      this.pool = mysql.createPool({
        host: env.DB_HOST,
        port: env.DB_PORT || 3306,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME || 'student_database',
        ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
      });

      console.log('✅ SDMS MySQL connection pool initialized');
    }
    return this.pool;
  }

  async authenticateStudent(identifier, password) {
    const [rows] = await this.getPool().query(`
      SELECT
        c.student_id,
        c.username,
        c.password_hash,
        s.student_name,
        s.email,
        s.student_status,
        s.student_photo,
        s.admission_number,
        s.pin_no,
        s.student_mobile,
        s.batch,
        s.college_id,
        s.course_id,
        s.branch_id,
        s.current_year,
        s.current_semester,
        s.section,
        COALESCE(s.college, col.name) AS college_name,
        COALESCE(s.course, crs.name) AS course_name,
        COALESCE(s.branch, cb.name) AS branch_name
      FROM student_credentials c
      INNER JOIN students s ON s.id = c.student_id
      LEFT JOIN colleges col ON s.college_id = col.id
      LEFT JOIN courses crs ON s.course_id = crs.id
      LEFT JOIN course_branches cb ON s.branch_id = cb.id
      WHERE c.username = ? OR c.admission_number = ?
      LIMIT 2
    `, [identifier, identifier]);

    if (rows.length !== 1) return null;
    const row = rows[0];
    const status = String(row.student_status || '').trim().toLowerCase();
    if (status && status !== 'regular' && status !== 'active') return null;
    if (!(await bcrypt.compare(password, row.password_hash))) return null;

    return this.formatStudentIdentity(row);
  }

  async getStudentIdentityById(studentId) {
    const [rows] = await this.getPool().query(`
      SELECT
        c.student_id,
        c.username,
        s.student_name,
        s.email,
        s.student_status,
        s.student_photo,
        s.admission_number,
        s.pin_no,
        s.student_mobile,
        s.batch,
        s.college_id,
        s.course_id,
        s.branch_id,
        s.current_year,
        s.current_semester,
        s.section,
        COALESCE(s.college, col.name) AS college_name,
        COALESCE(s.course, crs.name) AS course_name,
        COALESCE(s.branch, cb.name) AS branch_name
      FROM student_credentials c
      INNER JOIN students s ON s.id = c.student_id
      LEFT JOIN colleges col ON s.college_id = col.id
      LEFT JOIN courses crs ON s.course_id = crs.id
      LEFT JOIN course_branches cb ON s.branch_id = cb.id
      WHERE c.student_id = ?
      LIMIT 1
    `, [Number(studentId)]);
    if (!rows.length) return null;
    const status = String(rows[0].student_status || '').trim().toLowerCase();
    if (status && status !== 'regular' && status !== 'active') return null;
    return this.formatStudentIdentity(rows[0]);
  }

  formatStudentIdentity(row) {
    return {
      id: Number(row.student_id),
      username: row.username,
      name: row.student_name || row.username,
      email: row.email || '',
      photo: row.student_photo || null,
      student_photo: row.student_photo || null,
      roll_number: row.pin_no || row.admission_number || String(row.student_id),
      pin_no: row.pin_no || '',
      admission_number: row.admission_number || '',
      mobile_number: row.student_mobile || '',
      status: row.student_status || 'active',
      batch_name: row.batch || '',
      college_name: row.college_name || '',
      course_name: row.course_name || '',
      branch_name: row.branch_name || '',
      college_id: row.college_id === null ? null : Number(row.college_id),
      course_id: row.course_id === null ? null : Number(row.course_id),
      branch_id: row.branch_id === null ? null : Number(row.branch_id),
      year: row.current_year === null ? null : Number(row.current_year),
      semester: row.current_semester === null ? null : Number(row.current_semester),
      section: row.section || ''
    };
  }

  /**
   * Fetch all active colleges
   */
  async getColleges() {
    const pool = this.getPool();
    const [rows] = await pool.query(
      'SELECT id, name, code FROM colleges WHERE is_active = 1 ORDER BY name ASC'
    );
    return rows;
  }

  /**
   * Fetch courses for a specific college (or all active)
   */
  async getCourses(collegeId) {
    const pool = this.getPool();
    let query = 'SELECT id, college_id, name, code, total_years, semesters_per_year FROM courses WHERE is_active = 1';
    const params = [];

    const collegeIds = parseIdList(collegeId);
    if (collegeIds.length === 1) {
      query += ' AND college_id = ?';
      params.push(collegeIds[0]);
    } else if (collegeIds.length > 1) {
      query += ` AND college_id IN (${collegeIds.map(() => '?').join(', ')})`;
      params.push(...collegeIds);
    }
    query += ' ORDER BY name ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Fetch branches for a specific course and college
   */
  async getBranches(collegeId, courseId) {
    const pool = this.getPool();
    let query = `
      SELECT cb.id, cb.course_id, cb.name, cb.code 
      FROM course_branches cb 
      JOIN courses c ON cb.course_id = c.id 
      WHERE cb.is_active = 1
    `;
    const params = [];

    const courseIds = parseIdList(courseId);
    if (courseIds.length === 1) {
      query += ' AND cb.course_id = ?';
      params.push(courseIds[0]);
    } else if (courseIds.length > 1) {
      query += ` AND cb.course_id IN (${courseIds.map(() => '?').join(', ')})`;
      params.push(...courseIds);
    }

    const collegeIds = parseIdList(collegeId);
    if (collegeIds.length === 1) {
      query += ' AND c.college_id = ?';
      params.push(collegeIds[0]);
    } else if (collegeIds.length > 1) {
      query += ` AND c.college_id IN (${collegeIds.map(() => '?').join(', ')})`;
      params.push(...collegeIds);
    }
    query += ' ORDER BY cb.name ASC';

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Fetch available academic years (1, 2, 3, 4, etc.) strictly bounded by course total_years
   */
  async getYears(collegeId, courseId, branchId) {
    const pool = this.getPool();
    
    const courseIds = parseIdList(courseId);
    if (courseIds.length > 0) {
      const [courses] = await pool.query(`SELECT total_years FROM courses WHERE id IN (${courseIds.map(() => '?').join(', ')})`, courseIds);
      if (courses.length > 0) {
        const maxTotal = Math.max(...courses.map(c => Number(c.total_years) || 4));
        if (maxTotal > 0) {
          return Array.from({ length: maxTotal }, (_, i) => i + 1);
        }
      }
    }

    let query = "SELECT DISTINCT current_year as year FROM students WHERE current_year IS NOT NULL AND current_year > 0 AND (student_status = 'Regular' OR LOWER(student_status) = 'regular' OR student_status IS NULL OR student_status = 'Active')";
    const params = [];

    const collegeIds = parseIdList(collegeId);
    if (collegeIds.length === 1) {
      query += ' AND college_id = ?';
      params.push(collegeIds[0]);
    } else if (collegeIds.length > 1) {
      query += ` AND college_id IN (${collegeIds.map(() => '?').join(', ')})`;
      params.push(...collegeIds);
    }

    if (courseIds.length === 1) {
      query += ' AND course_id = ?';
      params.push(courseIds[0]);
    } else if (courseIds.length > 1) {
      query += ` AND course_id IN (${courseIds.map(() => '?').join(', ')})`;
      params.push(...courseIds);
    }

    const branchIds = parseIdList(branchId);
    if (branchIds.length === 1) {
      query += ' AND branch_id = ?';
      params.push(branchIds[0]);
    } else if (branchIds.length > 1) {
      query += ` AND branch_id IN (${branchIds.map(() => '?').join(', ')})`;
      params.push(...branchIds);
    }
    query += ' ORDER BY year ASC';

    const [rows] = await pool.query(query, params);
    return rows.map(r => Number(r.year)).filter(y => y >= 1 && y <= 6);
  }

  /**
   * Fetch available semesters (1 and 2 per academic year)
   */
  async getSemesters(collegeId, courseId, branchId, year) {
    // In SDMS RDS, current_semester is stored as 1 or 2 per academic year
    return [1, 2];
  }

  /**
   * Fetch sections (A, B, C, D, etc.)
   */
  async getSections(collegeId, courseId, branchId, year, semester) {
    const pool = this.getPool();
    let query = `
      SELECT DISTINCT s.section
      FROM students s
      WHERE s.section IS NOT NULL AND CHAR_LENGTH(s.section) > 0 AND (s.student_status = 'Regular' OR LOWER(s.student_status) = 'regular' OR s.student_status IS NULL)
    `;
    const params = [];

    const collegeIds = parseIdList(collegeId);
    if (collegeIds.length === 1) {
      query += ' AND s.college_id = ?';
      params.push(collegeIds[0]);
    } else if (collegeIds.length > 1) {
      query += ` AND s.college_id IN (${collegeIds.map(() => '?').join(', ')})`;
      params.push(...collegeIds);
    }

    const courseIds = parseIdList(courseId);
    if (courseIds.length === 1) {
      query += ' AND s.course_id = ?';
      params.push(courseIds[0]);
    } else if (courseIds.length > 1) {
      query += ` AND s.course_id IN (${courseIds.map(() => '?').join(', ')})`;
      params.push(...courseIds);
    }

    const branchIds = parseIdList(branchId);
    if (branchIds.length === 1) {
      query += ' AND s.branch_id = ?';
      params.push(branchIds[0]);
    } else if (branchIds.length > 1) {
      query += ` AND s.branch_id IN (${branchIds.map(() => '?').join(', ')})`;
      params.push(...branchIds);
    }

    const years = parseIdList(year);
    if (years.length === 1) {
      query += ' AND s.current_year = ?';
      params.push(years[0]);
    } else if (years.length > 1) {
      query += ` AND s.current_year IN (${years.map(() => '?').join(', ')})`;
      params.push(...years);
    }

    const sems = parseIdList(semester);
    if (sems.length === 1) {
      const semNum = sems[0];
      const normalizedSem = (semNum > 2 && years.length === 1) ? (((semNum - 1) % 2) + 1) : semNum;
      query += ' AND s.current_semester = ?';
      params.push(normalizedSem);
    } else if (sems.length > 1) {
      const normalizedSems = [...new Set(sems.map(s => (s > 2 ? (((s - 1) % 2) + 1) : s)))];
      query += ` AND s.current_semester IN (${normalizedSems.map(() => '?').join(', ')})`;
      params.push(...normalizedSems);
    }

    query += ' ORDER BY s.section ASC';

    const [rows] = await pool.query(query, params);
    return rows.map(r => r.section).filter(Boolean);
  }

  /**
   * Fetch and cache active colleges, courses, and branches
   */
  async getAcademicCatalog() {
    const now = Date.now();
    if (this.catalogCache && (now - this.catalogCacheTime < 300000)) {
      return this.catalogCache;
    }

    const pool = this.getPool();
    const [colleges] = await pool.query(
      'SELECT id, name, code FROM colleges WHERE is_active = 1 ORDER BY id ASC'
    );
    const [courses] = await pool.query(
      'SELECT id, college_id, name, code, total_years, semesters_per_year FROM courses WHERE is_active = 1 ORDER BY id ASC'
    );
    const [branches] = await pool.query(
      'SELECT id, course_id, name, code FROM course_branches WHERE is_active = 1 ORDER BY id ASC'
    );

    const collegesById = new Map();
    const collegesByCode = new Map();
    const collegesByName = new Map();
    for (const c of colleges) {
      collegesById.set(Number(c.id), c);
      if (c.code) collegesByCode.set(c.code.trim().toUpperCase(), c);
      if (c.name) collegesByName.set(c.name.trim().toLowerCase(), c);
    }

    const coursesById = new Map();
    const coursesByCode = new Map();
    const coursesByName = new Map();
    const coursesByCollegeAndCode = new Map();
    const coursesByCollegeAndName = new Map();
    for (const cou of courses) {
      coursesById.set(Number(cou.id), cou);
      if (cou.code) {
        const cCode = cou.code.trim().toUpperCase();
        coursesByCode.set(cCode, cou);
        coursesByCollegeAndCode.set(`${cou.college_id}:${cCode}`, cou);
      }
      if (cou.name) {
        const cName = cou.name.trim().toLowerCase();
        coursesByName.set(cName, cou);
        coursesByCollegeAndName.set(`${cou.college_id}:${cName}`, cou);
      }
    }

    const branchesById = new Map();
    const branchesByCode = new Map();
    const branchesByName = new Map();
    const branchesByCourseAndCode = new Map();
    const branchesByCourseAndName = new Map();
    for (const b of branches) {
      branchesById.set(Number(b.id), b);
      if (b.code) {
        const bCode = b.code.trim().toUpperCase();
        branchesByCode.set(bCode, b);
        branchesByCourseAndCode.set(`${b.course_id}:${bCode}`, b);
      }
      if (b.name) {
        const bName = b.name.trim().toLowerCase();
        branchesByName.set(bName, b);
        branchesByCourseAndName.set(`${b.course_id}:${bName}`, b);
      }
    }

    this.catalogCache = {
      colleges,
      courses,
      branches,
      collegesById,
      collegesByCode,
      collegesByName,
      coursesById,
      coursesByCode,
      coursesByName,
      coursesByCollegeAndCode,
      coursesByCollegeAndName,
      branchesById,
      branchesByCode,
      branchesByName,
      branchesByCourseAndCode,
      branchesByCourseAndName
    };
    this.catalogCacheTime = now;
    return this.catalogCache;
  }

  /**
   * Return complete academic validation rules hierarchy
   */
  async getAcademicValidationRules() {
    const catalog = await this.getAcademicCatalog();

    const collegeRules = catalog.colleges.map(col => {
      const colCourses = catalog.courses
        .filter(c => Number(c.college_id) === Number(col.id))
        .map(c => {
          const courseBranches = catalog.branches.filter(b => Number(b.course_id) === Number(c.id));
          const totalYears = Number(c.total_years) || 4;
          const semestersPerYear = Number(c.semesters_per_year) || 2;
          const maxSemesters = totalYears * semestersPerYear;

          const yearStructure = Array.from({ length: totalYears }, (_, i) => {
            const yr = i + 1;
            return {
              year: yr,
              relative_semesters: [1, 2],
              cumulative_semesters: [(yr - 1) * 2 + 1, yr * 2],
              semester_labels: [`${yr}-1`, `${yr}-2`]
            };
          });

          return {
            id: c.id,
            name: c.name,
            code: c.code,
            total_years: totalYears,
            semesters_per_year: semestersPerYear,
            max_semesters: maxSemesters,
            valid_years: Array.from({ length: totalYears }, (_, i) => i + 1),
            year_structure: yearStructure,
            branches: courseBranches.map(b => ({
              id: b.id,
              name: b.name,
              code: b.code
            }))
          };
        });

      return {
        id: col.id,
        name: col.name,
        code: col.code,
        courses: colCourses
      };
    });

    return {
      institution: 'Pydah Educational Academy',
      general_rules: {
        semesters_per_year: 2,
        max_duration_years: 6,
        max_duration_semesters: 12,
        valid_sections: ['A', 'B', 'C', 'D'],
        roll_number_format: '3-30 characters alphanumeric',
        mobile_format: '10 digits'
      },
      colleges: collegeRules
    };
  }

  /**
   * Helper: Parse Academic Year from multiple representations (number, roman numeral, string)
   */
  parseAcademicYear(raw) {
    if (raw === null || raw === undefined || raw === '') return null;
    const str = String(raw).trim().toUpperCase();
    if (str === 'I' || str === '1ST' || str === '1ST YEAR') return 1;
    if (str === 'II' || str === '2ND' || str === '2ND YEAR') return 2;
    if (str === 'III' || str === '3RD' || str === '3RD YEAR') return 3;
    if (str === 'IV' || str === '4TH' || str === '4TH YEAR') return 4;
    if (str === 'V' || str === '5TH' || str === '5TH YEAR') return 5;
    if (str === 'VI' || str === '6TH' || str === '6TH YEAR') return 6;
    const match = str.match(/\d+/);
    return match ? parseInt(match[0], 10) : NaN;
  }

  /**
   * Helper: Parse Academic Semester from multiple representations ('1', '2', '2-1', 'Sem 1', etc.)
   */
  parseAcademicSemester(raw) {
    if (raw === null || raw === undefined || raw === '') return null;
    const str = String(raw).trim().toUpperCase();

    // Check pattern like "2-1" or "3-2"
    const dashMatch = str.match(/^([1-6])\s*[-/]\s*([1-2])$/);
    if (dashMatch) {
      const yr = parseInt(dashMatch[1], 10);
      const sem = parseInt(dashMatch[2], 10);
      return {
        raw: str,
        year: yr,
        relativeSemester: sem,
        cumulativeSemester: (yr - 1) * 2 + sem,
        isRelative: true,
        label: `${yr}-${sem}`
      };
    }

    if (str === 'I' || str === 'SEM 1' || str === 'SEMESTER 1' || str === '1ST SEM') {
      return { raw: str, relativeSemester: 1, cumulativeSemester: 1, isRelative: true, label: 'Sem 1' };
    }
    if (str === 'II' || str === 'SEM 2' || str === 'SEMESTER 2' || str === '2ND SEM') {
      return { raw: str, relativeSemester: 2, cumulativeSemester: 2, isRelative: true, label: 'Sem 2' };
    }

    const numMatch = str.match(/\d+/);
    if (numMatch) {
      const num = parseInt(numMatch[0], 10);
      return {
        raw: str,
        number: num,
        isRelative: num <= 2,
        relativeSemester: num <= 2 ? num : ((num - 1) % 2) + 1,
        cumulativeSemester: num
      };
    }

    return { raw: str, number: NaN, isRelative: false };
  }

  /**
   * Validate a single student record against actual SDMS College, Course, Branch, Year, and Semesters
   */
  async validateStudentData(student, preloadedCatalog = null) {
    const catalog = preloadedCatalog || await this.getAcademicCatalog();
    const errors = [];

    // 1. Mandatory Identity Validations
    const rawRoll = student.roll_number || student.pin_no || student.student_id || student.admission_number || student.pin || '';
    const rollNumber = String(rawRoll).trim().toUpperCase();

    const rawName = student.name || student.student_name || student.full_name || '';
    const studentName = String(rawName).trim();

    const rawEmail = student.email || student.student_email || '';
    const email = String(rawEmail).trim();

    const rawMobile = student.mobile_number || student.student_mobile || student.phone || student.mobile || '';
    const mobile = String(rawMobile).trim();

    if (!rollNumber) {
      errors.push('Roll Number / PIN number is required');
    } else if (rollNumber.length < 3 || rollNumber.length > 30) {
      errors.push(`Roll Number must be between 3 and 30 characters (got "${rollNumber}")`);
    }

    if (!studentName) {
      errors.push('Student Name is required');
    } else if (studentName.length < 2) {
      errors.push(`Student Name must be at least 2 characters (got "${studentName}")`);
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Invalid email format: "${email}"`);
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (mobile && cleanMobile.length !== 10) {
      errors.push(`Mobile number must be exactly 10 digits (got "${mobile}")`);
    }

    // 2. College Resolution & Validation
    const rawCollege = student.college_id ?? student.college ?? student.college_name ?? student.college_code ?? student.campus_id ?? student.campus ?? null;
    let resolvedCollege = null;

    if (rawCollege !== null && rawCollege !== '') {
      const colNum = Number(rawCollege);
      if (!isNaN(colNum) && catalog.collegesById.has(colNum)) {
        resolvedCollege = catalog.collegesById.get(colNum);
      } else {
        const colStr = String(rawCollege).trim();
        const upper = colStr.toUpperCase();
        const lower = colStr.toLowerCase();
        resolvedCollege = catalog.collegesByCode.get(upper) ||
                          catalog.collegesByName.get(lower) ||
                          catalog.colleges.find(c => c.name.toLowerCase().includes(lower) || (c.code && c.code.toUpperCase().includes(upper)));
      }

      if (!resolvedCollege) {
        errors.push(`College "${rawCollege}" is not an active institution college`);
      }
    }

    // 3. Course Resolution & Validation
    const rawCourse = student.course_id ?? student.course ?? student.course_name ?? student.course_code ?? null;
    let resolvedCourse = null;

    if (rawCourse !== null && rawCourse !== '') {
      const couNum = Number(rawCourse);
      if (!isNaN(couNum) && catalog.coursesById.has(couNum)) {
        resolvedCourse = catalog.coursesById.get(couNum);
      } else {
        const couStr = String(rawCourse).trim();
        const upper = couStr.toUpperCase();
        const lower = couStr.toLowerCase();

        // If college is already known, check courses for that college first
        if (resolvedCollege) {
          resolvedCourse = catalog.coursesByCollegeAndCode.get(`${resolvedCollege.id}:${upper}`) ||
                           catalog.coursesByCollegeAndName.get(`${resolvedCollege.id}:${lower}`) ||
                           catalog.courses.find(c => Number(c.college_id) === Number(resolvedCollege.id) &&
                             (c.name.toLowerCase().includes(lower) || (c.code && c.code.toUpperCase().includes(upper))));
        }

        if (!resolvedCourse) {
          resolvedCourse = catalog.coursesByCode.get(upper) ||
                           catalog.coursesByName.get(lower) ||
                           catalog.courses.find(c => c.name.toLowerCase().includes(lower) || (c.code && c.code.toUpperCase().includes(upper)));
        }
      }

      if (!resolvedCourse) {
        errors.push(`Course "${rawCourse}" is not an active course in academic catalog`);
      } else if (resolvedCollege && Number(resolvedCourse.college_id) !== Number(resolvedCollege.id)) {
        const actualCollege = catalog.collegesById.get(Number(resolvedCourse.college_id));
        errors.push(`Course "${resolvedCourse.name}" belongs to "${actualCollege?.name || 'another college'}" (${actualCollege?.code || ''}), not "${resolvedCollege.name}"`);
      }
    }

    // If College was not given but Course was found, auto-fill College!
    if (!resolvedCollege && resolvedCourse) {
      resolvedCollege = catalog.collegesById.get(Number(resolvedCourse.college_id)) || null;
    }

    // 4. Branch Resolution & Validation
    const rawBranch = student.branch_id ?? student.branch ?? student.branch_name ?? student.branch_code ?? null;
    let resolvedBranch = null;

    if (rawBranch !== null && rawBranch !== '') {
      const brNum = Number(rawBranch);
      if (!isNaN(brNum) && catalog.branchesById.has(brNum)) {
        resolvedBranch = catalog.branchesById.get(brNum);
      } else {
        const brStr = String(rawBranch).trim();
        const upper = brStr.toUpperCase();
        const lower = brStr.toLowerCase();

        // If course is resolved, check branches for that course first
        if (resolvedCourse) {
          resolvedBranch = catalog.branchesByCourseAndCode.get(`${resolvedCourse.id}:${upper}`) ||
                           catalog.branchesByCourseAndName.get(`${resolvedCourse.id}:${lower}`) ||
                           catalog.branches.find(b => Number(b.course_id) === Number(resolvedCourse.id) &&
                             (b.name.toLowerCase().includes(lower) || (b.code && b.code.toUpperCase().includes(upper))));
        }

        if (!resolvedBranch) {
          resolvedBranch = catalog.branchesByCode.get(upper) ||
                           catalog.branchesByName.get(lower) ||
                           catalog.branches.find(b => b.name.toLowerCase().includes(lower) || (b.code && b.code.toUpperCase().includes(upper)));
        }
      }

      if (resolvedBranch && resolvedCourse && Number(resolvedBranch.course_id) !== Number(resolvedCourse.id)) {
        errors.push(`Branch "${resolvedBranch.name}" does not belong to course "${resolvedCourse.name}"`);
      }
    }

    // 5. Academic Year Validation
    const rawYear = student.current_year ?? student.year ?? student.academic_year ?? null;
    let parsedYear = this.parseAcademicYear(rawYear);

    // 6. Semester Resolution & Validation
    const rawSemester = student.current_semester ?? student.semester ?? student.sem ?? null;
    const parsedSemObj = this.parseAcademicSemester(rawSemester);

    // If semester had embedded year (e.g. "2-1"):
    if (parsedSemObj && parsedSemObj.year) {
      if (parsedYear !== null && parsedYear !== parsedSemObj.year) {
        errors.push(`Semester "${parsedSemObj.raw}" implies Academic Year ${parsedSemObj.year}, but Year was set to ${parsedYear}`);
      } else if (parsedYear === null) {
        parsedYear = parsedSemObj.year;
      }
    }

    // Check Year boundaries against Course
    const courseTotalYears = resolvedCourse ? Number(resolvedCourse.total_years) : 4;
    const maxCourseSemesters = courseTotalYears * (resolvedCourse ? Number(resolvedCourse.semesters_per_year) || 2 : 2);

    if (parsedYear !== null) {
      if (isNaN(parsedYear) || parsedYear < 1) {
        errors.push(`Academic Year must be a positive integer (got "${rawYear}")`);
      } else if (parsedYear > courseTotalYears) {
        errors.push(`Academic Year ${parsedYear} exceeds maximum duration of ${courseTotalYears} years for ${resolvedCourse ? resolvedCourse.name : 'this course'}`);
      }
    }

    // Validate Semester numbers
    let finalRelativeSemester = 1;
    let finalCumulativeSemester = 1;

    if (parsedSemObj) {
      if (parsedSemObj.number !== undefined && (isNaN(parsedSemObj.number) || parsedSemObj.number < 1)) {
        errors.push(`Semester must be a positive integer (got "${rawSemester}")`);
      } else {
        const semVal = parsedSemObj.number || parsedSemObj.relativeSemester;

        if (semVal > maxCourseSemesters) {
          errors.push(`Semester ${semVal} exceeds total course duration of ${maxCourseSemesters} semesters for ${resolvedCourse ? resolvedCourse.name : 'this course'}`);
        } else if (semVal > 2) {
          // Cumulative semester (e.g. 3, 4, 5, 6, 7, 8)
          const expectedYear = Math.ceil(semVal / 2);
          if (parsedYear !== null && parsedYear !== expectedYear) {
            errors.push(`Cumulative Semester ${semVal} belongs to Academic Year ${expectedYear}, not Year ${parsedYear}`);
          } else if (parsedYear === null) {
            parsedYear = expectedYear;
          }
          finalCumulativeSemester = semVal;
          finalRelativeSemester = ((semVal - 1) % 2) + 1;
        } else {
          // Relative semester (1 or 2)
          finalRelativeSemester = semVal;
          finalCumulativeSemester = parsedYear ? (parsedYear - 1) * 2 + semVal : semVal;
        }
      }
    } else {
      finalRelativeSemester = 1;
      finalCumulativeSemester = parsedYear ? (parsedYear - 1) * 2 + 1 : 1;
    }

    // 7. Section Validation
    const rawSection = student.section ?? student.sec ?? 'A';
    const cleanSection = String(rawSection).trim().toUpperCase();
    const finalSection = cleanSection ? cleanSection.slice(0, 5) : 'A';

    return {
      isValid: errors.length === 0,
      errors,
      normalizedData: {
        roll_number: rollNumber,
        student_name: studentName,
        email: email || `${rollNumber}@pydah.edu.in`,
        mobile_number: cleanMobile,
        college_id: resolvedCollege?.id || null,
        college_name: resolvedCollege?.name || '',
        college_code: resolvedCollege?.code || '',
        course_id: resolvedCourse?.id || null,
        course_name: resolvedCourse?.name || '',
        course_code: resolvedCourse?.code || '',
        branch_id: resolvedBranch?.id || null,
        branch_name: resolvedBranch?.name || '',
        branch_code: resolvedBranch?.code || '',
        current_year: parsedYear || 1,
        current_semester: finalRelativeSemester,
        relative_semester: finalRelativeSemester,
        cumulative_semester: finalCumulativeSemester,
        semester_label: parsedYear ? `${parsedYear}-${finalRelativeSemester}` : `Sem ${finalRelativeSemester}`,
        section: finalSection
      }
    };
  }

  /**
   * Bulk validate an array of student rows (from CSV/Excel upload)
   */
  async validateStudentUpload(studentsArray) {
    if (!Array.isArray(studentsArray)) {
      throw new Error('Students upload must be an array of student records');
    }

    const catalog = await this.getAcademicCatalog();
    const validStudents = [];
    const invalidStudents = [];

    for (let i = 0; i < studentsArray.length; i++) {
      const row = studentsArray[i];
      if (!row || Object.keys(row).length === 0) continue;

      const validation = await this.validateStudentData(row, catalog);
      const rowNumber = i + 2; // Row 1 is header in spreadsheets

      if (validation.isValid) {
        validStudents.push({
          row_number: rowNumber,
          ...validation.normalizedData
        });
      } else {
        invalidStudents.push({
          row_number: rowNumber,
          data: row,
          roll_number: validation.normalizedData.roll_number || 'N/A',
          student_name: validation.normalizedData.student_name || 'N/A',
          errors: validation.errors
        });
      }
    }

    return {
      success: true,
      totalCount: validStudents.length + invalidStudents.length,
      validCount: validStudents.length,
      invalidCount: invalidStudents.length,
      validStudents,
      invalidStudents
    };
  }

  /**
   * Fetch students with College, Course, Branch, Year, Sem, Section, Search and Pagination
   */
  async getFilteredStudents({
    collegeId,
    collegeIds,
    courseId,
    courseIds,
    branchId,
    branchIds,
    year,
    years,
    semester,
    section,
    search,
    page = 1,
    limit = 20,
    includePhoto = true,
    loginEnabledOnly = false
  }) {
    const pool = this.getPool();
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Filter Regular / Active students
    let whereClause = "WHERE (s.student_status = 'Regular' OR LOWER(s.student_status) = 'regular' OR s.student_status IS NULL OR s.student_status = 'Active')";
    if (loginEnabledOnly) {
      whereClause += ' AND EXISTS (SELECT 1 FROM student_credentials sc WHERE sc.student_id = s.id)';
    }
    const params = [];

    const appendFilter = (field, val, isNum = true) => {
      const items = isNum ? parseIdList(val) : parseStringList(val);
      if (items.length === 1) {
        whereClause += ` AND ${field} = ?`;
        params.push(items[0]);
      } else if (items.length > 1) {
        whereClause += ` AND ${field} IN (${items.map(() => '?').join(', ')})`;
        params.push(...items);
      }
    };

    appendFilter('s.college_id', (collegeIds && collegeIds.length) ? collegeIds : collegeId, true);
    appendFilter('s.course_id', (courseIds && courseIds.length) ? courseIds : courseId, true);
    appendFilter('s.branch_id', (branchIds && branchIds.length) ? branchIds : branchId, true);
    appendFilter('s.current_year', (years && years.length) ? years : year, true);

    const sems = parseIdList(semester);
    if (sems.length === 1) {
      const sNum = sems[0];
      const years = parseIdList(year);
      const normalizedSem = (sNum > 2 && years.length === 1) ? (((sNum - 1) % 2) + 1) : sNum;
      whereClause += ' AND s.current_semester = ?';
      params.push(normalizedSem);
    } else if (sems.length > 1) {
      const normalizedSems = [...new Set(sems.map(s => (s > 2 ? (((s - 1) % 2) + 1) : s)))];
      whereClause += ` AND s.current_semester IN (${normalizedSems.map(() => '?').join(', ')})`;
      params.push(...normalizedSems);
    }

    appendFilter('s.section', section, false);
    if (search && search.trim()) {
      const sTerm = `%${search.trim()}%`;
      whereClause += ' AND (s.student_name LIKE ? OR s.admission_number LIKE ? OR s.pin_no LIKE ? OR s.email LIKE ? OR s.student_mobile LIKE ?)';
      params.push(sTerm, sTerm, sTerm, sTerm, sTerm);
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM students s
      ${whereClause}
    `;

    const [countRows] = await pool.query(countQuery, params);
    const total = countRows[0]?.total || 0;

    // Data query
    const dataQuery = `
      SELECT 
        s.id,
        s.admission_number,
        s.pin_no,
        TRIM(s.student_name) as student_name,
        s.email,
        s.student_mobile,
        s.father_name,
        s.gender,
        s.batch,
        s.current_year,
        s.current_semester,
        s.section,
        s.student_status,
        ${includePhoto ? 's.student_photo' : 'NULL as student_photo'},
        s.college_id,
        s.course_id,
        s.branch_id,
        COALESCE(s.college, col.name) as college_name,
        COALESCE(s.course, c.name) as course_name,
        COALESCE(s.branch, cb.name) as branch_name
      FROM students s
      LEFT JOIN colleges col ON s.college_id = col.id
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN course_branches cb ON s.branch_id = cb.id
      ${whereClause}
      ORDER BY s.current_year ASC, s.current_semester ASC, s.pin_no ASC, s.student_name ASC
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...params, limitNum, offset];
    const [rows] = await pool.query(dataQuery, dataParams);

    // Format for frontend consumption
    const formattedStudents = rows.map(s => {
      const identifier = s.pin_no || s.admission_number || `STD${s.id}`;
      return {
        _id: s.id.toString(),
        id: s.id,
        sdms_student_id: Number(s.id),
        admission_number: s.admission_number || '',
        name: s.student_name || 'N/A',
        student_name: s.student_name || 'N/A',
        photo: s.student_photo || null,
        student_photo: s.student_photo || null,
        pin_no: s.pin_no || identifier,
        roll_number: identifier,
        username: identifier,
        email: s.email || `${identifier}@pydah.edu.in`,
        mobile_number: s.student_mobile || '',
        campus_name: s.college_name || 'Main Campus',
        college_name: s.college_name || '',
        course_name: s.course_name || 'General',
        branch_name: s.branch_name || '',
        batch_name: s.batch || '',
        year: s.current_year,
        semester: s.current_semester,
        section: s.section || '',
        gender: s.gender || '',
        status: s.student_status || 'active',
        source: 'sdms'
      };
    });

    return {
      students: formattedStudents,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
        has_more: offset + rows.length < total
      }
    };
  }

  async getAllFilteredStudents(filters, maxRows = 10000) {
    const pageSize = 200;
    const firstPage = await this.getFilteredStudents({
      ...filters,
      page: 1,
      limit: pageSize
    });
    const students = [...firstPage.students];
    const pageCount = Math.min(
      Math.ceil(firstPage.pagination.total / pageSize),
      Math.ceil(maxRows / pageSize)
    );
    for (let page = 2; page <= pageCount; page += 1) {
      const result = await this.getFilteredStudents({
        ...filters,
        page,
        limit: pageSize
      });
      students.push(...result.students);
    }
    return {
      students: students.slice(0, maxRows),
      total: firstPage.pagination.total,
      truncated: firstPage.pagination.total > maxRows
    };
  }

  async getExamAudience(test, collegeId = null, maxStudents = 5000, courseId = null) {
    const targetCols = parseIdList(test.target_college_ids);
    const scopeCols = parseIdList(collegeId);
    let effectiveCol = null;
    if (scopeCols.length > 0 && targetCols.length > 0) {
      effectiveCol = targetCols.filter(id => scopeCols.includes(id));
      if (effectiveCol.length === 0) effectiveCol = [-1];
    } else {
      effectiveCol = targetCols.length > 0 ? targetCols : (scopeCols.length > 0 ? scopeCols : null);
    }

    const targetCourses = parseIdList(test.target_course_ids);
    const scopeCourses = parseIdList(courseId);
    let effectiveCourse = null;
    if (scopeCourses.length > 0 && targetCourses.length > 0) {
      effectiveCourse = targetCourses.filter(id => scopeCourses.includes(id));
      if (effectiveCourse.length === 0) effectiveCourse = [-1];
    } else {
      effectiveCourse = targetCourses.length > 0 ? targetCourses : (scopeCourses.length > 0 ? scopeCourses : null);
    }

    const filters = {
      collegeId: effectiveCol,
      courseId: effectiveCourse,
      branchId: test.target_branch_ids?.length ? test.target_branch_ids : null,
      year: test.target_years?.length ? test.target_years : null,
      semester: test.target_semesters?.length ? test.target_semesters : null,
      section: test.target_sections?.length ? test.target_sections : null,
      page: 1,
      limit: 200,
      includePhoto: false,
      loginEnabledOnly: true
    };

    const result = await this.getAllFilteredStudents(filters, maxStudents);
    return {
      students: result.students,
      total: result.total,
      truncated: result.truncated
    };
  }

  async getExamAudienceCount(test, collegeId = null, courseId = null) {
    const targetCols = parseIdList(test.target_college_ids);
    const scopeCols = parseIdList(collegeId);
    let effectiveCol = null;
    if (scopeCols.length > 0 && targetCols.length > 0) {
      effectiveCol = targetCols.filter(id => scopeCols.includes(id));
      if (effectiveCol.length === 0) return 0;
    } else {
      effectiveCol = targetCols.length > 0 ? targetCols : (scopeCols.length > 0 ? scopeCols : null);
    }

    const targetCourses = parseIdList(test.target_course_ids);
    const scopeCourses = parseIdList(courseId);
    let effectiveCourse = null;
    if (scopeCourses.length > 0 && targetCourses.length > 0) {
      effectiveCourse = targetCourses.filter(id => scopeCourses.includes(id));
      if (effectiveCourse.length === 0) return 0;
    } else {
      effectiveCourse = targetCourses.length > 0 ? targetCourses : (scopeCourses.length > 0 ? scopeCourses : null);
    }

    const filters = {
      collegeId: effectiveCol,
      courseId: effectiveCourse,
      branchId: test.target_branch_ids?.length ? test.target_branch_ids : null,
      year: test.target_years?.length ? test.target_years : null,
      semester: test.target_semesters?.length ? test.target_semesters : null,
      section: test.target_sections?.length ? test.target_sections : null,
      page: 1,
      limit: 1,
      includePhoto: false,
      loginEnabledOnly: true
    };
    const result = await this.getFilteredStudents(filters);
    return result.pagination?.total || 0;
  }

  async getBatchCount(collegeId = null) {
    let query = `
      SELECT COUNT(DISTINCT NULLIF(TRIM(batch), '')) AS total
      FROM students
      WHERE (student_status = 'Regular' OR LOWER(student_status) = 'regular' OR student_status IS NULL OR student_status = 'Active')
    `;
    const params = [];
    if (collegeId) {
      query += ' AND college_id = ?';
      params.push(Number(collegeId));
    }
    const [rows] = await this.getPool().query(query, params);
    return Number(rows[0]?.total || 0);
  }

}

module.exports = new SDMSService();
