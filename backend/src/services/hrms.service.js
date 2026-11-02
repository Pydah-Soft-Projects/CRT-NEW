const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const User = require('../models/User');

class HRMSService {
  constructor() {
    this.connection = null;
    this.departmentsMap = null;
    this.designationsMap = null;
    this.lastCacheTime = 0;
  }

  /**
   * Get or initialize persistent HRMS MongoDB connection
   */
  async getHRMSConnection() {
    if (this.connection && this.connection.readyState === 1) {
      return this.connection;
    }

    try {
      const uri = env.HRMS_MONGODB_URI;
      if (!uri) {
        throw new Error('HRMS_MONGODB_URI is not set in environment variables');
      }
      this.connection = await mongoose.createConnection(uri, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 8000
      }).asPromise();

      console.log('✅ Connected to HRMS MongoDB Database');
      return this.connection;
    } catch (error) {
      console.error('❌ Failed to connect to HRMS MongoDB:', error.message);
      throw new Error(`HRMS Database Connection Error: ${error.message}`);
    }
  }

  /**
   * Cache departments & designations for fast enrichment
   */
  async loadMetadataCache(force = false) {
    const now = Date.now();
    // Cache for 10 minutes unless forced
    if (!force && this.departmentsMap && this.designationsMap && (now - this.lastCacheTime < 600000)) {
      return { departments: this.departmentsMap, designations: this.designationsMap };
    }

    try {
      const conn = await this.getHRMSConnection();
      const [depts, desigs] = await Promise.all([
        conn.db.collection('departments').find({}, { projection: { name: 1, code: 1 } }).toArray(),
        conn.db.collection('designations').find({}, { projection: { name: 1, code: 1 } }).toArray()
      ]);

      this.departmentsMap = new Map(depts.map(d => [d._id.toString(), d.name]));
      this.designationsMap = new Map(desigs.map(d => [d._id.toString(), d.name]));
      this.lastCacheTime = now;

      return { departments: this.departmentsMap, designations: this.designationsMap };
    } catch (error) {
      console.warn('⚠️ Failed to load HRMS metadata cache:', error.message);
      return { departments: this.departmentsMap || new Map(), designations: this.designationsMap || new Map() };
    }
  }

  /**
   * Get list of all departments
   */
  async getDepartments() {
    const conn = await this.getHRMSConnection();
    return conn.db.collection('departments')
      .find({}, { projection: { name: 1, code: 1 } })
      .sort({ name: 1 })
      .toArray();
  }

  /**
   * Get list of all designations
   */
  async getDesignations() {
    const conn = await this.getHRMSConnection();
    return conn.db.collection('designations')
      .find({}, { projection: { name: 1, code: 1 } })
      .sort({ name: 1 })
      .toArray();
  }

  /**
   * Live search employees from HRMS database
   */
  async searchEmployees({ search = '', department_id = '', page = 1, limit = 20, unlinkedOnly = false }) {
    try {
      const conn = await this.getHRMSConnection();
      await this.loadMetadataCache();

      const query = { is_active: { $ne: false } };

      if (department_id) {
        try {
          query.department_id = new mongoose.Types.ObjectId(department_id);
        } catch (_) {
          query.department_id = department_id;
        }
      }

      if (search && search.trim()) {
        const cleanSearch = search.trim();
        query.$or = [
          { emp_no: { $regex: cleanSearch, $options: 'i' } },
          { employee_name: { $regex: cleanSearch, $options: 'i' } },
          { email: { $regex: cleanSearch, $options: 'i' } },
          { phone_number: { $regex: cleanSearch, $options: 'i' } }
        ];
      }

      // Fetch existing linked emp_nos in CRT portal
      const linkedUsers = await User.find({ emp_no: { $exists: true, $ne: null } })
        .select('emp_no role status name _id')
        .lean();
      
      const linkedEmpMap = new Map(linkedUsers.map(u => [String(u.emp_no), u]));

      if (unlinkedOnly) {
        const linkedEmpNos = Array.from(linkedEmpMap.keys());
        query.emp_no = { $nin: linkedEmpNos };
      }

      const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

      const [employees, total] = await Promise.all([
        conn.db.collection('employees')
          .find(query, {
            projection: {
              emp_no: 1,
              employee_name: 1,
              email: 1,
              phone_number: 1,
              department_id: 1,
              designation_id: 1,
              division_id: 1,
              doj: 1,
              is_active: 1
            }
          })
          .sort({ employee_name: 1 })
          .skip(skip)
          .limit(limitNum)
          .toArray(),
        conn.db.collection('employees').countDocuments(query)
      ]);

      // Enrich with department and designation names, and portal link status
      const enriched = employees.map(emp => {
        const deptId = emp.department_id ? emp.department_id.toString() : '';
        const desigId = emp.designation_id ? emp.designation_id.toString() : '';
        const linkedUser = linkedEmpMap.get(String(emp.emp_no));

        return {
          emp_no: emp.emp_no,
          employee_name: emp.employee_name,
          email: emp.email || '',
          phone_number: emp.phone_number || '',
          department_id: deptId,
          department_name: this.departmentsMap?.get(deptId) || 'General',
          designation_id: desigId,
          designation_name: this.designationsMap?.get(desigId) || 'Staff',
          doj: emp.doj,
          is_linked: !!linkedUser,
          portal_user: linkedUser ? {
            id: linkedUser._id,
            role: linkedUser.role,
            status: linkedUser.status
          } : null
        };
      });

      return {
        success: true,
        data: enriched,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } catch (error) {
      console.error('searchEmployees Error:', error);
      return { success: false, message: error.message, data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
    }
  }

  /**
   * Find a single employee by emp_no with enriched metadata
   */
  async getEmployeeByEmpNo(empNo) {
    try {
      const conn = await this.getHRMSConnection();
      await this.loadMetadataCache();

      const emp = await conn.db.collection('employees').findOne(
        { emp_no: String(empNo).trim() },
        {
          projection: {
            emp_no: 1,
            employee_name: 1,
            email: 1,
            phone_number: 1,
            department_id: 1,
            designation_id: 1,
            division_id: 1,
            doj: 1,
            is_active: 1
          }
        }
      );

      if (!emp) return null;

      const deptId = emp.department_id ? emp.department_id.toString() : '';
      const desigId = emp.designation_id ? emp.designation_id.toString() : '';

      return {
        emp_no: emp.emp_no,
        employee_name: emp.employee_name,
        email: emp.email || '',
        phone_number: emp.phone_number || '',
        department_id: deptId,
        department_name: this.departmentsMap?.get(deptId) || 'General',
        designation_id: desigId,
        designation_name: this.designationsMap?.get(desigId) || 'Staff',
        is_active: emp.is_active !== false
      };
    } catch (error) {
      console.error('getEmployeeByEmpNo Error:', error);
      return null;
    }
  }

  /**
   * Verify password against HRMS Database for a given employee number / username / email
   */
  async verifyHRMSPassword(identifier, plainPassword) {
    try {
      if (!identifier || !plainPassword) {
        return { verified: false, message: 'Missing identifier or password' };
      }

      const conn = await this.getHRMSConnection();
      const cleanId = String(identifier).trim();

      // Look up in HRMS employees collection first
      const emp = await conn.db.collection('employees').findOne(
        {
          $or: [
            { emp_no: cleanId },
            { email: cleanId }
          ]
        },
        {
          projection: {
            emp_no: 1,
            employee_name: 1,
            email: 1,
            password: 1,
            is_active: 1,
            department_id: 1,
            designation_id: 1
          }
        }
      );

      let passwordHash = emp?.password;
      let matchedRecord = emp;

      // If not in employees or employee has no password, check HRMS users collection
      if (!passwordHash) {
        const hrmsUser = await conn.db.collection('users').findOne(
          {
            $or: [
              { employeeId: cleanId },
              { email: cleanId }
            ]
          },
          {
            projection: {
              employeeId: 1,
              name: 1,
              email: 1,
              password: 1,
              isActive: 1
            }
          }
        );

        if (hrmsUser && hrmsUser.password) {
          passwordHash = hrmsUser.password;
          matchedRecord = {
            emp_no: hrmsUser.employeeId || cleanId,
            employee_name: hrmsUser.name,
            email: hrmsUser.email,
            is_active: hrmsUser.isActive !== false
          };
        }
      }

      if (!passwordHash) {
        return { verified: false, message: 'No credentials found in HRMS for this user' };
      }

      if (matchedRecord && matchedRecord.is_active === false) {
        return { verified: false, message: 'HRMS account is inactive' };
      }

      const isMatch = await bcrypt.compare(plainPassword, passwordHash);
      if (!isMatch) {
        return { verified: false, message: 'Incorrect HRMS database password' };
      }

      return {
        verified: true,
        employee: {
          emp_no: matchedRecord.emp_no,
          employee_name: matchedRecord.employee_name,
          email: matchedRecord.email
        }
      };
    } catch (error) {
      console.error('verifyHRMSPassword Error:', error);
      return { verified: false, message: `HRMS verification error: ${error.message}` };
    }
  }
}

module.exports = new HRMSService();
