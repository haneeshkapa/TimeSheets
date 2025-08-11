import React, { useState } from 'react';

interface WeeklyCalendarViewProps {
  weekDates: Array<{ day: string; date: string; key: string }>;
  timesheet: any;
  onHoursChange: (day: string, hours: number) => void;
}

const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({ 
  weekDates, 
  timesheet, 
  onHoursChange 
}) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<{ [key: string]: boolean[] }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState<{ day: string; slot: number } | null>(null);

  // Time slots from 6 AM to 11 PM
  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = 6 + i;
    const time24 = `${hour.toString().padStart(2, '0')}:00`;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const time12 = `${displayHour} ${period}`;
    return { hour, time24, time12 };
  });

  // Initialize selected slots from timesheet data
  React.useEffect(() => {
    const initialSlots: { [key: string]: boolean[] } = {};
    weekDates.forEach(day => {
      // Initialize all days with empty slots (no preloading from timesheet)
      // Users will manually select their preferred hours
      const slots = new Array(18).fill(false);
      initialSlots[day.key] = slots;
    });
    setSelectedSlots(initialSlots);
  }, [weekDates]); // Remove timesheet dependency to avoid auto-filling

  // Track changes to notify parent component
  const [lastChangedDay, setLastChangedDay] = useState<{ day: string; hours: number } | null>(null);

  // Notify parent when state changes (moved to useEffect to avoid render conflicts)
  React.useEffect(() => {
    if (lastChangedDay) {
      onHoursChange(lastChangedDay.day, lastChangedDay.hours);
      setLastChangedDay(null);
    }
  }, [lastChangedDay, onHoursChange]);

  const handleTimeSlotClick = (dayKey: string, slotIndex: number) => {
    setSelectedSlots(prev => {
      const currentSlots = prev[dayKey] || new Array(18).fill(false);
      const newSlots = [...currentSlots];
      
      // Toggle the clicked slot
      newSlots[slotIndex] = !newSlots[slotIndex];
      
      // Calculate total hours for this day
      const totalHours = newSlots.reduce((sum, isSelected) => sum + (isSelected ? 1 : 0), 0);
      
      // Schedule parent notification
      setLastChangedDay({ day: dayKey, hours: totalHours });
      
      return { ...prev, [dayKey]: newSlots };
    });
  };

  const quickSetHours = (dayKey: string, hours: number) => {
    const newSlots = new Array(18).fill(false);
    
    // Set hours starting from 9 AM (index 3) for more typical work schedule
    const startSlot = 3; // 9 AM
    for (let i = 0; i < Math.min(hours, 18 - startSlot); i++) {
      newSlots[startSlot + i] = true;
    }
    
    setSelectedSlots(prev => ({ ...prev, [dayKey]: newSlots }));
    setLastChangedDay({ day: dayKey, hours });
  };

  const clearDay = (dayKey: string) => {
    const newSlots = new Array(18).fill(false);
    setSelectedSlots(prev => ({ ...prev, [dayKey]: newSlots }));
    setLastChangedDay({ day: dayKey, hours: 0 });
  };

  const getDayHours = (dayKey: string) => {
    const slots = selectedSlots[dayKey] || new Array(18).fill(false);
    return slots.reduce((sum, isSelected) => sum + (isSelected ? 1 : 0), 0);
  };

  const getTotalWeekHours = () => {
    return weekDates.reduce((total, day) => {
      return total + getDayHours(day.key);
    }, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Weekly Time Calendar</h3>
        <div className="text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span>📍 Click individual time slots to toggle hours</span>
            <span>⚡ Use quick buttons for common hours</span>
            <span className="font-medium">Total week: {getTotalWeekHours()}h</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-2">
        {/* Header row */}
        <div className="text-xs font-medium text-gray-500 p-2">Time</div>
        {weekDates.map((day) => (
          <div key={day.key} className="text-center p-2">
            <div className="text-sm font-medium text-gray-900">{day.day}</div>
            <div className="text-xs text-gray-500">{day.date}</div>
            <div className="mt-2">
              <div className="text-xs font-medium text-blue-600">
                {getDayHours(day.key)}h
              </div>
              {/* Quick buttons */}
              <div className="flex gap-1 mt-1 justify-center">
                {[4, 8].map((h) => (
                  <button
                    key={h}
                    onClick={() => quickSetHours(day.key, h)}
                    className="px-1 py-0.5 text-xs bg-gray-100 hover:bg-blue-100 rounded border"
                  >
                    {h}h
                  </button>
                ))}
                <button
                  onClick={() => clearDay(day.key)}
                  className="px-1 py-0.5 text-xs bg-red-100 hover:bg-red-200 rounded border text-red-700"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Time slot rows */}
        {timeSlots.map((slot) => (
          <React.Fragment key={slot.hour}>
            {/* Time label */}
            <div className="text-xs text-gray-500 p-2 text-right border-r border-gray-100">
              {slot.time12}
            </div>
            
            {/* Day columns */}
            {weekDates.map((day) => {
              const slots = selectedSlots[day.key] || new Array(18).fill(false);
              const slotIndex = slot.hour - 6;
              const isSelected = slots[slotIndex];
              
              
              return (
                <div
                  key={`${day.key}-${slot.hour}`}
                  className="relative"
                >
                  <button
                    onClick={() => handleTimeSlotClick(day.key, slotIndex)}
                    className={`w-full h-8 border-2 rounded-md transition-all duration-200 transform hover:scale-105 ${
                      isSelected
                        ? 'bg-blue-500 hover:bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-gray-50 hover:bg-blue-100 border-gray-200 hover:border-blue-300'
                    }`}
                    title={`${day.day} ${slot.time12} - Click to toggle`}
                  >
                    <div className="flex items-center justify-center h-full">
                      {isSelected ? (
                        <span className="text-xs font-bold">●</span>
                      ) : (
                        <span className="text-xs text-gray-400">○</span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Daily breakdown:
          </div>
          <div className="text-sm font-medium text-gray-900">
            Week total: {getTotalWeekHours()} hours
          </div>
        </div>
        <div className="flex gap-4 mt-2 text-xs">
          {weekDates.map((day) => {
            const hours = getDayHours(day.key);
            return (
              <span key={day.key} className="text-gray-600">
                {day.day.slice(0, 3)}: {hours}h
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendarView;