import React, { useState, useEffect } from 'react';

interface SimpleTimeCalendarProps {
  weekDates: Array<{ day: string; date: string; key: string }>;
  timesheet: any;
  onHoursChange: (day: string, hours: number) => void;
}

const SimpleTimeCalendar: React.FC<SimpleTimeCalendarProps> = ({ 
  weekDates, 
  timesheet, 
  onHoursChange 
}) => {
  // Track selected hours for each day - simple number, not array
  const [selectedHours, setSelectedHours] = useState<{ [key: string]: number }>({});
  // Track current day index for slider
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  // Time slots from 6 AM to 11 PM
  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = 6 + i;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const time12 = `${displayHour} ${period}`;
    return { hour, time12, slotIndex: i };
  });

  const handleHourClick = (dayKey: string, targetHours: number) => {
    setSelectedHours(prev => {
      const newHours = { ...prev, [dayKey]: targetHours };
      onHoursChange(dayKey, targetHours);
      return newHours;
    });
  };

  const getDayHours = (dayKey: string) => {
    return selectedHours[dayKey] || 0;
  };

  const getTotalWeekHours = () => {
    return weekDates.reduce((total, day) => {
      return total + getDayHours(day.key);
    }, 0);
  };

  const goToNextDay = () => {
    if (currentDayIndex < weekDates.length - 1) {
      setCurrentDayIndex(currentDayIndex + 1);
    }
  };

  const goToPrevDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1);
    }
  };

  const goToDay = (index: number) => {
    setCurrentDayIndex(index);
  };

  // Touch handling for swipe gestures
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNextDay();
    }
    if (isRightSwipe) {
      goToPrevDay();
    }
  };

  const currentDay = weekDates[currentDayIndex];
  const currentDayHours = getDayHours(currentDay.key);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Simple Hour Selector</h3>
        <div className="text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span>🎯 Swipe or use arrows to navigate days</span>
            <span className="font-medium">Total week: {getTotalWeekHours()}h</span>
          </div>
        </div>
      </div>

      {/* Day Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevDay}
            disabled={currentDayIndex === 0}
            className={`p-2 rounded-full transition-all duration-200 ${
              currentDayIndex === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            ← Previous
          </button>

          <div className="text-center">
            <h4 className="text-xl font-bold text-gray-900">{currentDay.day}</h4>
            <p className="text-sm text-gray-500">{currentDay.date}</p>
            <div className="text-3xl font-bold text-blue-600 mt-2">{currentDayHours}h</div>
            <div className="text-sm text-gray-500">Total Hours</div>
          </div>

          <button
            onClick={goToNextDay}
            disabled={currentDayIndex === weekDates.length - 1}
            className={`p-2 rounded-full transition-all duration-200 ${
              currentDayIndex === weekDates.length - 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            Next →
          </button>
        </div>

        {/* Day indicators */}
        <div className="flex justify-center gap-2 mb-4">
          {weekDates.map((day, index) => (
            <button
              key={day.key}
              onClick={() => goToDay(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentDayIndex
                  ? 'bg-blue-500 shadow-md'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              title={`${day.day} - ${getDayHours(day.key)}h`}
            />
          ))}
        </div>

        {/* Week overview bar */}
        <div className="flex gap-1 mb-4">
          {weekDates.map((day, index) => {
            const hours = getDayHours(day.key);
            const maxHours = 12;
            const heightPercent = (hours / maxHours) * 100;
            
            return (
              <button
                key={day.key}
                onClick={() => goToDay(index)}
                className={`flex-1 bg-gray-100 rounded-t-md relative overflow-hidden transition-all duration-200 hover:bg-gray-200 ${
                  index === currentDayIndex ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{ height: '60px' }}
                title={`${day.day}: ${hours}h`}
              >
                <div 
                  className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-300 ${
                    hours > 0 ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                  style={{ height: `${Math.max(heightPercent, hours > 0 ? 10 : 0)}%` }}
                />
                <div className="absolute inset-0 flex flex-col justify-end items-center pb-1">
                  <div className="text-xs font-medium text-gray-700">{hours}h</div>
                  <div className="text-xs text-gray-500">{day.day.slice(0, 3)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Swipeable day content */}
      <div 
        className="border rounded-lg p-6 bg-gray-50"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Hour selection buttons */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((hours) => (
            <button
              key={hours}
              onClick={() => handleHourClick(currentDay.key, hours)}
              className={`p-3 text-lg rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                currentDayHours === hours
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white hover:bg-blue-50 text-gray-700 shadow-sm border border-gray-200'
              }`}
            >
              {hours}h
            </button>
          ))}
        </div>

        {/* Common presets */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => handleHourClick(currentDay.key, 4)}
            className="px-4 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors duration-200"
          >
            Half Day (4h)
          </button>
          <button
            onClick={() => handleHourClick(currentDay.key, 8)}
            className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors duration-200"
          >
            Full Day (8h)
          </button>
          <button
            onClick={() => handleHourClick(currentDay.key, 0)}
            className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors duration-200"
          >
            No Work (0h)
          </button>
        </div>
      </div>

      {/* Week Summary */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-100">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium text-gray-700">Week Summary:</div>
          <div className="text-xl font-bold text-gray-900">{getTotalWeekHours()} hours total</div>
        </div>
        <div className="flex gap-4 mt-2 text-sm text-gray-600 flex-wrap">
          {weekDates.map((day) => (
            <span key={day.key} className={`${currentDay.key === day.key ? 'font-bold text-blue-600' : ''}`}>
              {day.day.slice(0, 3)}: {getDayHours(day.key)}h
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimpleTimeCalendar;