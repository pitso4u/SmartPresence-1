import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CreditCard, User, Mail, Phone, Printer, Check } from 'lucide-react';
import { Card } from '../types';

// Types
interface Student {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  photoUrl: string;
  studentId: string;
  department: string;
  year: number;
}

interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  photoUrl: string;
  employeeId: string;
  department: string;
  position: string;
}

interface UserInfo {
  fullName: string;
  type: string;
  photoUrl: string;
  idNumber: string;
  department: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

// Sample data
const sampleStudents: Student[] = [
  {
    id: '1',
    fullName: 'Alice Johnson',
    email: 'alice.johnson@university.edu',
    phone: '+1-555-0123',
    photoUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    studentId: 'ST001',
    department: 'Computer Science',
    year: 3
  },
  {
    id: '2',
    fullName: 'Bob Smith',
    email: 'bob.smith@university.edu',
    phone: '+1-555-0124',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    studentId: 'ST002',
    department: 'Engineering',
    year: 2
  },
  {
    id: '3',
    fullName: 'Carol Davis',
    email: 'carol.davis@university.edu',
    photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    studentId: 'ST003',
    department: 'Business',
    year: 4
  }
];

const sampleEmployees: Employee[] = [
  {
    id: '4',
    fullName: 'Dr. Sarah Wilson',
    email: 'sarah.wilson@university.edu',
    phone: '+1-555-0125',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    employeeId: 'EMP001',
    department: 'Computer Science',
    position: 'Professor'
  },
  {
    id: '5',
    fullName: 'Mike Brown',
    email: 'mike.brown@university.edu',
    phone: '+1-555-0126',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    employeeId: 'EMP002',
    department: 'Administration',
    position: 'IT Support'
  }
];

// Generate cards for users
const generateCardsForUsers = (students: Student[], employees: Employee[]): Card[] => {
  const cards: Card[] = [];
  
  students.forEach(student => {
    cards.push({
      id: `card-${student.id}`,
      user_id: student.id,
      user_type: 'student',
      issue_date: new Date().toISOString(),
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      status: 'active',
      card_image_path: '',
      qr_code_path: '',
      qr_code_url: ''
    });
  });
  
  employees.forEach(employee => {
    cards.push({
      id: `card-${employee.id}`,
      user_id: employee.id,
      user_type: 'employee',
      issue_date: new Date().toISOString(),
      expiry_date: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 2 years from now
      status: 'active',
      card_image_path: '',
      qr_code_path: '',
      qr_code_url: ''
    });
  });
  
  return cards;
};

// IDCard Component
function IDCard({ card, userInfo, className = '', isSelected = false, onToggleSelect }: {
  card: Card;
  userInfo: UserInfo;
  className?: string;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  if (!userInfo) return null;

  return (
    <div className={`relative bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all duration-200 ${
      isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200'
    } ${className}`}>
      {/* Selection checkbox */}
      {onToggleSelect && (
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => onToggleSelect(card.id)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              isSelected 
                ? 'bg-blue-500 border-blue-500 text-white' 
                : 'bg-white border-gray-300 hover:border-blue-400'
            }`}
          >
            {isSelected && <Check className="h-3 w-3" />}
          </button>
        </div>
      )}
      
      {/* Card Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">ID Card</h2>
          <CreditCard className="h-6 w-6" />
        </div>
      </div>
      
      {/* Card Body */}
      <div className="p-4">
        <div className="flex gap-4">
          {/* Photo */}
          <div className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
            <img 
              src={userInfo.photoUrl} 
              alt={userInfo.fullName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500"><User class="h-8 w-8" /></div>';
              }}
            />
          </div>
          
          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{userInfo.fullName}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{userInfo.type}</span>
            </p>
            <p className="text-sm text-gray-600 truncate">ID: {userInfo.idNumber}</p>
            <p className="text-sm text-gray-600 truncate">Dept: {userInfo.department}</p>
            
            {userInfo.email && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{userInfo.email}</span>
              </p>
            )}
            
            {userInfo.phone && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{userInfo.phone}</span>
              </p>
            )}
          </div>
        </div>
        
        {/* Card Footer */}
        <div className="mt-4 pt-2 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
          <span>Issued: {card.issue_date ? new Date(card.issue_date).toLocaleDateString() : 'N/A'}</span>
          <span>Expires: {card.expiry_date ? new Date(card.expiry_date).toLocaleDateString() : 'N/A'}</span>
        </div>
        
        {/* Status indicator */}
        <div className="mt-2">
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
            card.status === 'active' ? 'bg-green-100 text-green-800' :
            card.status === 'expired' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

// Main component
export default function IDCardSystem() {
  const [cards, setCards] = useState<Card[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'students' | 'employees'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const cardsData = generateCardsForUsers(sampleStudents, sampleEmployees);
      setCards(cardsData);
      setStudents(sampleStudents);
      setEmployees(sampleEmployees);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Get user info for a card
  const getUserInfo = (card: Card): UserInfo => {
    if (card.user_type === 'student') {
      const student = students.find(s => s.id === card.user_id);
      if (student) {
        return {
          fullName: student.fullName,
          type: `Student - Year ${student.year}`,
          photoUrl: student.photoUrl,
          idNumber: student.studentId,
          department: student.department,
          email: student.email,
          phone: student.phone
        };
      }
    } else {
      const employee = employees.find(e => e.id === card.user_id);
      if (employee) {
        return {
          fullName: employee.fullName,
          type: employee.position,
          photoUrl: employee.photoUrl,
          idNumber: employee.employeeId,
          department: employee.department,
          email: employee.email,
          phone: employee.phone
        };
      }
    }
    
    return {
      fullName: 'Unknown User',
      type: 'Unknown',
      photoUrl: '',
      idNumber: 'N/A',
      department: 'Unknown'
    };
  };

  // Filter cards based on view mode
  const filteredCards = cards.filter(card => {
    if (viewMode === 'students') return card.user_type === 'student';
    if (viewMode === 'employees') return card.user_type === 'employee';
    return true;
  });

  // Toggle card selection
  const toggleCardSelection = (cardId: string) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  // Toggle select all
  const allSelected = filteredCards.length > 0 && selectedCards.length === filteredCards.length;
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedCards([]);
    } else {
      setSelectedCards(filteredCards.map(card => card.id));
    }
  };