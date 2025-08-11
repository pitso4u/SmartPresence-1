import { Card } from '../types';
import { CreditCard, User, Mail, Phone } from 'lucide-react';

interface IDCardProps {
  card: Card;
  userInfo: {
    fullName: string;
    type: string;
    photoUrl: string;
    idNumber: string;
    department: string;
    email?: string;
    phone?: string;
    [key: string]: any;
  };
  className?: string;
}

export function IDCard({ card, userInfo, className = '' }: IDCardProps) {
  if (!userInfo) return null;

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 ${className}`}>
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
          <div className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden">
            <img 
              src={userInfo.photoUrl} 
              alt={userInfo.fullName}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{userInfo.fullName}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <User className="h-4 w-4" />
              {userInfo.type}
            </p>
            <p className="text-sm text-gray-600">ID: {userInfo.idNumber}</p>
            <p className="text-sm text-gray-600">Dept: {userInfo.department}</p>
            
            {userInfo.email && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {userInfo.email}
              </p>
            )}
            
            {userInfo.phone && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {userInfo.phone}
              </p>
            )}
          </div>
        </div>
        
        {/* Card Footer */}
        <div className="mt-4 pt-2 border-t border-gray-200 text-sm text-gray-500 flex justify-between items-center">
          <span>Issued: {card.issue_date ? new Date(card.issue_date).toLocaleDateString() : 'N/A'}</span>
          <span>Expires: {card.expiry_date ? new Date(card.expiry_date).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
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