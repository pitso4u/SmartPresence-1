import { Card } from '../types';
import IDCard from './IDCard';

interface CardItemProps {
  card: Card;
  userInfo: {
    name: string;
    identifier?: string;
    grade?: string;
    dob?: string;
    photo?: string;
    classroom?: string;
    job_title?: string;
  };
  isSelected: boolean;
  onToggleSelect: (cardId: string) => void;
}

export function CardItem({ card, userInfo, isSelected, onToggleSelect }: CardItemProps) {
  // Add a click handler that toggles selection when clicking on the card
  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger if the click wasn't on a button or input
    if (!(e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement)) {
      onToggleSelect(card.id);
    }
  };

  // Prepare the user info in the format expected by IDCard
  const idCardUserInfo = {
    name: userInfo?.name || 'Unknown User',
    identifier: userInfo?.identifier || `ID: ${card.user_id}`,
    grade: userInfo?.grade || userInfo?.classroom || 'N/A',
    dob: userInfo?.dob || 'N/A',
    photo: userInfo?.photo,
    job_title: userInfo?.job_title
  };

  return (
    <div 
      className={`relative transition-all duration-200 ${isSelected ? 'ring-4 ring-blue-500 rounded-xl' : ''}`}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <IDCard 
        card={card} 
        userInfo={idCardUserInfo} 
        className={isSelected ? 'ring-2 ring-blue-500' : ''}
      />
      
      {/* Selection indicator */}
      <div 
        className={`absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
          isSelected ? 'bg-blue-500 text-white' : 'bg-white text-gray-400 border-2 border-gray-300'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(card.id);
        }}
      >
        {isSelected ? (
          <svg 
            className="h-4 w-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={3} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        ) : null}
      </div>
    </div>
  );
}
