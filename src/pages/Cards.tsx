import { useState, useEffect, useRef, useCallback } from 'react';
import { CreditCard, Printer } from 'lucide-react';
import { Card } from '../types';
import { cardService } from '../services/cardService';
import { studentService } from '../services/studentService';
import { IDCard } from '@/components/IDCard';
import { employeeService } from '../services/employeeService';
import { CardItem } from '../components/CardItem';

export function Cards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'students' | 'employees'>('all');
  const [isPrinting, setIsPrinting] = useState(false);
  const printComponentRef = useRef<HTMLDivElement>(null);

  // Helper function to get user info based on card type
  const getUserInfo = useCallback((card: Card) => {
    if (card.user_type === 'student') {
      const student = students?.find(s => s.id === card.user_id);
      console.log('Finding student for card:', { card, student });
      return student ? {
        ...student,
        name: student.full_name || student.name || 'Student',
        identifier: student.student_code || `ID: ${student.id}`,
        grade: student.grade,
        classroom: student.classroom,
        photo_path: student.photo_path,
        client_uuid: student.client_uuid
      } : null;
    } else if (card.user_type === 'employee') {
      const employee = employees?.find(e => e.id === card.user_id);
      return employee ? {
        ...employee,
        name: employee.full_name || employee.name || 'Employee',
        identifier: employee.employee_id || employee.identifier || `ID: ${employee.id}`,
        job_title: employee.job_title || 'Staff'
      } : null;
    }
    return null;
  }, [students, employees]);
  
  // Set up print functionality
  const handlePrint = useCallback(async () => {
    try {
      setIsPrinting(true);
      
      const cardsToPrint = selectedCards.length > 0 
        ? cards.filter(card => selectedCards.includes(card.id))
        : cards;
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window. Please allow popups for this site.');
      }
      
      // Create a print-specific stylesheet
      const printStyles = `
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        .print-header {
          text-align: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .print-header h1 {
          margin: 0 0 5px 0;
          color: #2d3748;
          font-size: 24px;
        }
        
        .print-header p {
          margin: 0;
          color: #718096;
          font-size: 14px;
        }
        
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          padding: 20px;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .print-card {
          width: 100%;
          max-width: 300px;
          margin: 0 auto;
          transform: scale(0.9);
          transition: transform 0.2s ease;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .print-card:hover {
          transform: scale(0.92);
          z-index: 10;
        }
        
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          
          body {
            padding: 10mm !important;
            background: white !important;
          }
          
          .print-card {
            margin: 0 auto 5mm auto;
            width: 90mm !important;
            height: 54mm !important;
            transform: none !important;
          }
          
          .card-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 5mm !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `;
      
      // Create a temporary container to render the IDCard components
      const tempContainer = document.createElement('div');
      document.body.appendChild(tempContainer);
      
      // Use ReactDOM to render the IDCards to a string
      const { renderToString } = await import('react-dom/server');
      
      const cardsHtml = cardsToPrint.map(card => {
        const userInfo = getUserInfo(card);
        if (!userInfo) return '';
        
        return renderToString(
          <div className="print-card" style={{ marginBottom: '20px' }}>
            <IDCard card={card} userInfo={userInfo} className="print-mode" />
          </div>
        );
      }).join('');
      
      // Clean up the temporary container
      document.body.removeChild(tempContainer);
      
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>SmartPresence ID Cards</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
            <style>
              ${printStyles}
              
              /* Reset all margins and paddings for print */
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              /* Ensure the grid takes full width */
              .card-grid {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              
              /* Make sure cards don't get cut off */
              .print-card {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                margin: 0 auto 5mm auto !important;
              }
              
              /* Force background colors to print */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <h1>SmartPresence ID Cards</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="card-grid">
              ${cardsHtml}
            </div>
            <script>
              // Close the print window after printing
              window.onafterprint = function() {
                window.close();
              };
              
              // Trigger print when the page loads
              window.onload = function() {
                // Small delay to ensure all content is rendered
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `;
      
      // Write the content to the print window
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      
    } catch (error) {
      console.error('Error during print preparation:', error);
      alert('Failed to prepare print preview. Please try again.');
    } finally {
      setIsPrinting(false);
    }
  }, [selectedCards, cards, getUserInfo]);
  
  // Toggle card selection
  const toggleCardSelection = useCallback((cardId: number) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  }, []);
  
  // Filter cards based on view mode
  const filteredCards = cards.filter(card => {
    const matchesView = viewMode === 'all' || 
                       (viewMode === 'students' && card.user_type === 'student') ||
                       (viewMode === 'employees' && card.user_type === 'employee');
    
    if (matchesView) {
      const userInfo = getUserInfo(card);
      console.log(`Card ${card.id} (${card.user_type}):`, { card, userInfo });
    }
    
    return matchesView;
  });
  
  // Check if all cards are selected
  const allSelected = filteredCards.length > 0 && selectedCards.length === filteredCards.length;
  
  // Toggle select all cards
  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedCards([]);
    } else {
      setSelectedCards(filteredCards.map(card => card.id));
    }
  }, [allSelected, filteredCards]);
  
  // Generate cards for all users if none exist
  const generateCardsForUsers = async (students: any[], employees: any[]) => {
    try {
      console.log('Generating cards for all users in bulk...');
      
      // Use the bulk generation endpoint
      const { cards: newCards } = await cardService.generateAll();
      console.log(`Generated ${newCards.length} new cards`);
      
      return newCards;
    } catch (error) {
      console.error('Error generating cards in bulk:', error);
      
      // Fallback to individual generation if bulk fails
      console.log('Falling back to individual card generation...');
      const newCards: Card[] = [];
      
      try {
        // Generate cards for students
        for (const student of students) {
          try {
            const card = await cardService.generate(student.id, 'student');
            newCards.push(card);
          } catch (err) {
            console.error(`Error generating card for student ${student.id}:`, err);
          }
        }
        
        // Generate cards for employees
        for (const employee of employees) {
          try {
            const card = await cardService.generate(employee.id, 'employee');
            newCards.push(card);
          } catch (err) {
            console.error(`Error generating card for employee ${employee.id}:`, err);
          }
        }
      } catch (err) {
        console.error('Error in fallback card generation:', err);
      }
      
      return newCards;
    }
  };

  // Load data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching data...');
      const [cardsData, studentsData, employeesData] = await Promise.all([
        cardService.getAll(),
        studentService.getAll(),
        employeeService.getAll()
      ]);
      
      console.log('Initial cards data:', cardsData);
      console.log('Students data:', studentsData);
      console.log('Employees data:', employeesData);
      
      // If no cards exist but we have students or employees, generate cards
      if (cardsData.length === 0 && (studentsData.length > 0 || employeesData.length > 0)) {
        console.log('No cards found. Generating cards for existing users...');
        const newCards = await generateCardsForUsers(studentsData, employeesData);
        if (newCards.length > 0) {
          console.log('Generated new cards:', newCards);
          setCards(newCards);
        } else {
          console.log('No new cards were generated');
        }
      } else {
        setCards(cardsData);
      }
      
      setStudents(studentsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">ID Cards</h1>
          <p className="text-gray-600 mt-1 sm:mt-2">Generated identification cards for students and employees</p>
          
          {selectedCards.length > 0 && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-sm text-gray-600">{selectedCards.length} selected</span>
              <button 
                onClick={toggleSelectAll}
                className="text-sm text-blue-600 hover:underline"
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
          {selectedCards.length > 0 && (
            <button 
              onClick={handlePrint}
              disabled={isPrinting}
              className={`w-full sm:w-auto ${
                isPrinting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2`}
            >
              {isPrinting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Preparing Print...</span>
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4" />
                  <span>Print Selected ({selectedCards.length})</span>
                </>
              )}
            </button>
          )}
          
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap ${viewMode === 'all' ? 'bg-white shadow' : 'text-gray-600'}`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('students')}
              className={`px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap ${viewMode === 'students' ? 'bg-white shadow' : 'text-gray-600'}`}
            >
              Students
            </button>
            <button
              onClick={() => setViewMode('employees')}
              className={`px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap ${viewMode === 'employees' ? 'bg-white shadow' : 'text-gray-600'}`}
            >
              Employees
            </button>
          </div>
        </div>
      </div>

      {/* Print component ref - used for printing */}
      <div ref={printComponentRef} className="hidden" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCards.map((card) => {
          const userInfo = getUserInfo(card);
          const isSelected = selectedCards.includes(card.id);
          
          return (
            <CardItem 
              key={card.id}
              card={card}
              userInfo={userInfo}
              isSelected={isSelected}
              onToggleSelect={toggleCardSelection}
            />
          );
        })}
      </div>
      
      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No ID cards found for the selected filter</p>
        </div>
      )}
      
      {cards.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No ID cards have been generated yet</p>
        </div>
      )}
    </div>
  );
}