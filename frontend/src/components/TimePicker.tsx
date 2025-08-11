import React, { useState } from 'react';

interface TimePickerProps {
  day: string;
  dayName: string;
  date: string;
  hours: number;
  onHoursChange: (hours: number) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ day, dayName, date, hours, onHoursChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Generate time slots from 6 AM to 11 PM (17 hours) in 30-minute increments
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const time12 = formatTime12Hour(hour, minute);
        const value = hour + (minute / 60);
        slots.push({ time24, time12, value });
      }
    }
    return slots;
  };

  const formatTime12Hour = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const timeSlots = generateTimeSlots();
  const [selectedSlots, setSelectedSlots] = useState<number[]>(() => {
    // Convert current hours back to selected slots
    const slots = [];
    let remainingHours = hours;
    for (let i = 0; i < timeSlots.length && remainingHours > 0; i++) {
      if (remainingHours >= 0.5) {
        slots.push(i);
        remainingHours -= 0.5;
      }
    }
    return slots;
  });

  const toggleTimeSlot = (slotIndex: number) => {
    const newSelectedSlots = selectedSlots.includes(slotIndex)
      ? selectedSlots.filter(i => i !== slotIndex)
      : [...selectedSlots, slotIndex].sort((a, b) => a - b);
    
    setSelectedSlots(newSelectedSlots);
    
    // Calculate total hours (each slot = 0.5 hours)
    const totalHours = newSelectedSlots.length * 0.5;
    onHoursChange(totalHours);
  };

  const clearAll = () => {
    setSelectedSlots([]);
    onHoursChange(0);
  };

  const quickSelect = (hours: number) => {
    const slotsNeeded = Math.min(hours * 2, timeSlots.length); // 2 slots per hour
    const newSlots = Array.from({ length: slotsNeeded }, (_, i) => i);
    setSelectedSlots(newSlots);
    onHoursChange(slotsNeeded * 0.5);
  };

  const getHoursDisplay = () => {
    if (hours === 0) return '0h';
    const wholeHours = Math.floor(hours);
    const minutes = (hours - wholeHours) * 60;
    if (minutes === 0) return `${wholeHours}h`;
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-20 h-12 text-center border-2 rounded-lg font-medium transition-all duration-200 ${
          hours > 0 
            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm hover:border-blue-600' 
            : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
        }`}
      >
        {getHoursDisplay()}
      </button>
      
      {isOpen && (
        <div className="absolute top-14 left-0 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 min-w-80">
          <div className="mb-3">
            <h4 className="font-medium text-gray-900">{dayName}</h4>
            <p className="text-sm text-gray-500">{date}</p>
          </div>
          
          {/* Quick select buttons */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Quick Select:</p>
            <div className="flex gap-1 flex-wrap">
              {[1, 2, 4, 6, 8].map((h) => (
                <button
                  key={h}
                  onClick={() => quickSelect(h)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
                >
                  {h}h
                </button>
              ))}
              <button
                onClick={clearAll}
                className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded border"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Time slots grid */}
          <div className="max-h-64 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1">
              {timeSlots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => toggleTimeSlot(index)}
                  className={`p-1 text-xs rounded text-left transition-colors duration-150 ${
                    selectedSlots.includes(index)
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {slot.time12}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">
              Total: {getHoursDisplay()}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Done
            </button>
          </div>
        </div>
      )}
      
      {/* Overlay to close picker */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TimePicker;