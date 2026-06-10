import React, { useState, useEffect } from 'react';

export const CurrentTime: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${hours}:${minutes}:${seconds}, ${day}/${month}/${year}`;
  };

  return (
    <div className="mb-4 text-slate-600 font-medium text-sm md:text-base flex items-center gap-2">
      <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
      Bây giờ là: <span className="text-slate-900 font-bold">{formatTime(time)}</span>
    </div>
  );
};
