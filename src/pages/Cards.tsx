import React, { useState, useEffect } from 'react';
import { CreditCard, Download, User } from 'lucide-react';
import { Card } from '../types';
import { cardService } from '../services/cardService';
import { studentService } from '../services/studentService';
import { employeeService } from '../services/employeeService';
import { format } from 'date-fns';

export function Cards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cardsData, studentsData, employeesData] = await Promise.all([
        cardService.getAll(),
        studentService.getAll(),
        employeeService.getAll()
      ]);
      
      setCards(cardsData);
      setStudents(studentsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading cards data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInfo = (card: Card) => {
    if (card.user_type === 'student') {
      const student = students.find(s => s.id === card.user_id);
      return student ? { 
        name: student.full_name, 
        identifier: student.student_code, 
        grade: student.grade,
        photo: student.photo_path 
      } : null;
    } else {
      const employee = employees.find(e => e.id === card.user_id);
      return employee ? { 
        name: employee.full_name, 
        identifier: employee.employee_id, 
        grade: employee.job_title,
        photo: employee.photo_path 
      } : null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ID Cards</h1>
          <p className="text-gray-600 mt-2">Generated identification cards for students and employees</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export All</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((card) => {
          const userInfo = getUserInfo(card);
          return (
            <div key={card.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Card Preview */}
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white">
                <div className="absolute top-4 right-4">
                  <CreditCard className="h-6 w-6 opacity-80" />
                </div>
                
                <div className="flex items-center space-x-4">
                  {userInfo ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover border-3 border-white"
                      src={userInfo.photo}
                      alt={userInfo.name}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                      <User className="h-8 w-8" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">
                      {userInfo?.name || 'Unknown User'}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {userInfo?.identifier || `ID: ${card.user_id}`}
                    </p>
                    <p className="text-blue-100 text-xs mt-1">
                      {userInfo?.grade || card.user_type}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-400 border-opacity-30">
                  <div className="flex justify-between items-center text-xs">
                    <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
                      SmartPresence
                    </span>
                    <span className="capitalize">
                      {card.user_type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Info */}
              <div className="p-4">
                <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                  <span>Generated:</span>
                  <span>{format(new Date(card.generated_at), 'MMM dd, yyyy')}</span>
                </div>
                
                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                    Download
                  </button>
                  <button className="flex-1 bg-gray-50 text-gray-600 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                    Print
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No ID cards have been generated yet</p>
        </div>
      )}
    </div>
  );
}