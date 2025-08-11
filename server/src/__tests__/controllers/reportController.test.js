const request = require('supertest');
const app = require('../../app');
const { query } = require('../../db/config');
const { createTestUser, getAuthToken } = require('../test-utils');

// Mock the database queries
jest.mock('../../db/config');

// Mock the logger to prevent console output during tests
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

describe('Report Controller', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    // Create a test user and get auth token
    testUser = await createTestUser();
    authToken = await getAuthToken(testUser.email, 'password123');
  });

  afterAll(async () => {
    // Clean up test data
    await query('DELETE FROM users WHERE email LIKE ?', ['test_%@example.com']);
  });

  describe('GET /api/v1/reports/attendance', () => {
    it('should return attendance report data', async () => {
      const mockAttendanceData = [
        { date: '2023-01-01', user_type: 'student', status: 'present', count: 10 },
        { date: '2023-01-01', user_type: 'employee', status: 'present', count: 5 },
      ];
      
      query.mockResolvedValueOnce(mockAttendanceData);

      const response = await request(app)
        .get('/api/v1/reports/attendance')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          start_date: '2023-01-01',
          end_date: '2023-01-31',
          user_type: 'all',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAttendanceData);
      
      // Verify the query was called with correct parameters
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([
          new Date('2023-01-01').toISOString(),
          new Date('2023-01-31T23:59:59.999Z').toISOString(),
        ])
      );
    });

    it('should handle errors when fetching attendance report', async () => {
      query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/reports/attendance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Failed to generate attendance report');
    });
  });

  describe('GET /api/v1/reports/students', () => {
    it('should return student report data', async () => {
      const mockStudentData = [
        { 
          id: 1, 
          full_name: 'John Doe', 
          grade: '10', 
          classroom: 'A',
          present_count: 15,
          late_count: 2,
          absent_count: 1,
        },
      ];
      
      query.mockResolvedValueOnce(mockStudentData);

      const response = await request(app)
        .get('/api/v1/reports/students')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          grade: '10',
          classroom: 'A',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        fullName: 'John Doe',
        grade: '10',
        classroom: 'A',
        presentCount: 15,
        lateCount: 2,
        absentCount: 1,
        totalRecords: 18,
        attendanceRate: expect.any(Number),
      });
    });
  });

  describe('GET /api/v1/reports/employees', () => {
    it('should return employee report data', async () => {
      const mockEmployeeData = [
        { 
          id: 1, 
          full_name: 'Jane Smith', 
          department: 'HR', 
          position: 'Manager',
          present_count: 20,
          late_count: 1,
          absent_count: 0,
        },
      ];
      
      query.mockResolvedValueOnce(mockEmployeeData);

      const response = await request(app)
        .get('/api/v1/reports/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          department: 'HR',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        fullName: 'Jane Smith',
        department: 'HR',
        position: 'Manager',
        presentCount: 20,
        lateCount: 1,
        absentCount: 0,
        totalRecords: 21,
        attendanceRate: 100, // (20 + 1) / 21 * 100
      });
    });
  });

  describe('GET /api/v1/reports/visitors', () => {
    it('should return visitor report data', async () => {
      const mockVisitorData = [
        {
          id: 1,
          full_name: 'Visitor One',
          contact_number: '1234567890',
          email: 'visitor@example.com',
          purpose: 'Meeting',
          visit_date: '2023-01-15',
          check_in_time: '2023-01-15T09:00:00.000Z',
          check_out_time: '2023-01-15T10:30:00.000Z',
          employee_name: 'Jane Smith',
          employee_department: 'HR',
        },
      ];
      
      query.mockResolvedValueOnce(mockVisitorData);

      const response = await request(app)
        .get('/api/v1/reports/visitors')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          start_date: '2023-01-01',
          end_date: '2023-01-31',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        fullName: 'Visitor One',
        purpose: 'Meeting',
        employeeName: 'Jane Smith',
        employeeDepartment: 'HR',
      });
    });
  });

  describe('GET /api/v1/reports/incidents', () => {
    it('should return incident report data', async () => {
      const mockIncidentData = [
        {
          id: 1,
          title: 'Security Breach',
          description: 'Unauthorized access detected',
          incident_date: '2023-01-15',
          severity: 'high',
          status: 'open',
          reporter_name: 'John Doe',
          reporter_role: 'admin',
          created_at: '2023-01-15T10:00:00.000Z',
          updated_at: '2023-01-15T10:00:00.000Z',
        },
      ];
      
      query.mockResolvedValueOnce(mockIncidentData);

      const response = await request(app)
        .get('/api/v1/reports/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          severity: 'high',
          status: 'open',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        title: 'Security Breach',
        severity: 'high',
        status: 'open',
      });
    });
  });

  describe('GET /api/v1/reports/id-cards', () => {
    it('should return ID card report data', async () => {
      const mockIdCardData = [
        {
          id: 1,
          card_number: 'CARD123',
          user_id: 1,
          user_type: 'employee',
          user_name: 'Jane Smith',
          issue_date: '2023-01-01',
          expiry_date: '2024-01-01',
          status: 'active',
          last_used: '2023-06-15T08:30:00.000Z',
        },
      ];
      
      query.mockResolvedValueOnce(mockIdCardData);

      const response = await request(app)
        .get('/api/v1/reports/id-cards')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          status: 'active',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        cardNumber: 'CARD123',
        userName: 'Jane Smith',
        status: 'active',
      });
    });
  });
});
