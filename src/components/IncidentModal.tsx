import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import { incidentService } from '../services/incidentService';
import { studentService } from '../services/studentService';
import { employeeService } from '../services/employeeService';

interface IncidentModalProps {
  incident: Incident | null;
  onClose: () => void;
  onSave: () => void;
}

export function IncidentModal({ incident, onClose, onSave }: IncidentModalProps) {
  const [formData, setFormData] = useState({
    incident_type: '',
    description: '',
    reporter_name: '',
    user_id: '',
    user_type: '',
  });
  const [students, setStudents] = useState<Array<{id: number, name: string}>>([]);
  const [employees, setEmployees] = useState<Array<{id: number, name: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const [studentsData, employeesData] = await Promise.all([
          studentService.getAll(),
          employeeService.getAll()
        ]);
        
        setStudents(studentsData.map((s: any) => ({
          id: s.id,
          name: `${s.full_name} (${s.student_code || 'N/A'})`
        })));
        
        setEmployees(employeesData.map((e: any) => ({
          id: e.id,
          name: `${e.full_name} (${e.employee_id || 'N/A'})`
        })));
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (incident) {
      setFormData({
        incident_type: incident.incident_type || '',
        description: incident.description || '',
        reporter_name: incident.reporter_name || '',
        user_id: incident.user_id?.toString() || '',
        user_type: incident.user_type || '',
      });
    } else {
      setFormData({
        incident_type: '',
        description: '',
        reporter_name: '',
        user_id: '',
        user_type: '',
      });
    }
  }, [incident]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const incidentData = {
        ...formData,
        user_id: formData.user_id ? parseInt(formData.user_id, 10) : null,
        user_type: formData.user_type as 'student' | 'employee' | null,
      };

      if (incident) {
        await incidentService.update(incident.id, {
          ...incidentData,
          synced: incident.synced,
        });
      } else {
        await incidentService.create({
          ...incidentData,
          synced: 0,
        });
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save incident:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{incident ? 'Edit' : 'Report'} Incident</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="incident_type" className="block text-sm font-medium text-gray-700">Incident Type</label>
            <select
              id="incident_type"
              name="incident_type"
              value={formData.incident_type}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select type</option>
              <option value="Security">Security</option>
              <option value="Tardiness">Tardiness</option>
              <option value="Behavioral">Behavioral</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="reporter_name" className="block text-sm font-medium text-gray-700">Reporter Name</label>
            <input
              type="text"
              id="reporter_name"
              name="reporter_name"
              value={formData.reporter_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="user_type" className="block text-sm font-medium text-gray-700">User Type (Optional)</label>
              <select
                id="user_type"
                name="user_type"
                value={formData.user_type}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">N/A</option>
                <option value="student">Student</option>
                <option value="employee">Employee</option>
              </select>
            </div>
            <div>
              <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">
                {formData.user_type ? `${formData.user_type.charAt(0).toUpperCase() + formData.user_type.slice(1)}` : 'User'} (Optional)
              </label>
              <select
                id="user_id"
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={!formData.user_type || isLoading}
              >
                <option value="">Select {formData.user_type || 'user'}</option>
                {formData.user_type === 'student' && students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
                {formData.user_type === 'employee' && employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              {incident ? 'Save Changes' : 'Report Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
