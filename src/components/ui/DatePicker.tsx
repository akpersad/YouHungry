'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  id,
  label,
  required = false,
  disabled = false,
  className,
  error,
  placeholder = 'Select date and time',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    value ? new Date(value).toTimeString().slice(0, 5) : ''
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update selected date when value prop changes
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setSelectedTime(date.toTimeString().slice(0, 5));
    } else {
      setSelectedDate(null);
      setSelectedTime('');
    }
  }, [value]);

  const formatDisplayValue = () => {
    if (!selectedDate) return '';

    const dateStr = selectedDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
    const timeStr = selectedTime || '12:00';
    return `${dateStr}, ${timeStr}`;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth()));

    // Update the value with the selected date and current time
    const time = selectedTime || '12:00';
    const [hours, minutes] = time.split(':');
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours), parseInt(minutes));

    onChange(newDate.toISOString());
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);

    if (selectedDate) {
      const [hours, minutes] = time.split(':');
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      onChange(newDate.toISOString());
    }
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleInputClick();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isSelected =
        selectedDate && date.toDateString() === selectedDate.toDateString();
      const isPast = date < today;

      days.push({
        date,
        isCurrentMonth,
        isToday,
        isSelected,
        isPast,
      });
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const days = generateCalendarDays();
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-text mb-2"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={formatDisplayValue()}
          onChange={() => {}} // Controlled by our component
          onClick={handleInputClick}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            'w-full px-3 py-2 pr-10 border border-border rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            'disabled:bg-surface disabled:cursor-not-allowed',
            'cursor-pointer',
            error && 'border-destructive focus:ring-destructive'
          )}
          readOnly
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Calendar className="h-4 w-4 text-text-light" />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-md shadow-lg">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-surface rounded"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <h3 className="text-sm font-medium text-text">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>

            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-surface rounded"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-3">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div
                  key={day}
                  className="text-xs text-text-light text-center py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(day.date)}
                  disabled={day.isPast}
                  className={cn(
                    'text-xs py-2 px-1 rounded hover:bg-surface',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    day.isCurrentMonth ? 'text-text' : 'text-text-light',
                    day.isToday && 'bg-primary/10 text-blue-900 font-medium',
                    day.isSelected &&
                      'bg-blue-600 text-white hover:bg-blue-700',
                    !day.isCurrentMonth && 'hover:bg-transparent'
                  )}
                >
                  {day.date.getDate()}
                </button>
              ))}
            </div>
          </div>

          {/* Time picker */}
          <div className="p-3 border-t bg-surface">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-text-light" />
              <label className="text-sm font-medium text-text">Time:</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
