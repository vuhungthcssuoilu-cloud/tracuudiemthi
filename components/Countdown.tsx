import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDateStr: string;
  color?: string;
}

export const Countdown: React.FC<CountdownProps> = ({ targetDateStr, color = '#337ab7' }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const [isValidDate, setIsValidDate] = useState(true);

  useEffect(() => {
    // Thử parse ngày từ chuỗi (hỗ trợ nhiều định dạng, ưu tiên YYYY-MM-DDTHH:mm hoặc YYYY/MM/DD)
    // Nếu người dùng nhập text tự do (VD: "Ngày 20 tháng 5"), đồng hồ sẽ không hiển thị
    let targetDate = new Date(targetDateStr).getTime();
    
    // Nếu parse thất bại, thử một số định dạng phổ biến ở VN (DD/MM/YYYY)
    if (isNaN(targetDate)) {
      const parts = targetDateStr.split(/[-/]/);
      if (parts.length === 3) {
        // Giả định DD/MM/YYYY
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        
        // Kiểm tra năm có hợp lý không (YYYY)
        if (year > 2000) {
           targetDate = new Date(year, month, day).getTime();
        }
      }
    }

    if (isNaN(targetDate)) {
      setIsValidDate(false);
      return;
    }

    setIsValidDate(true);

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft(null); // Đã qua thời điểm
      }
    };

    calculateTimeLeft(); // Tính ngay lần đầu
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDateStr]);

  if (!isValidDate) {
    // Trả về text bình thường nếu không parse được ngày
    return (
      <p className="text-[16px] font-bold uppercase mt-2" style={{ color }}>
        Ngày công bố kết quả: {targetDateStr}
      </p>
    );
  }

  if (!timeLeft) {
    return (
      <p className="text-[16px] font-bold uppercase mt-2" style={{ color }}>
        Đã đến thời gian công bố kết quả
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-col items-center">
      <p className="text-[14px] font-semibold text-slate-600 uppercase mb-2">
        Thời gian đếm ngược đến lúc công bố:
      </p>
      <div className="flex gap-3 text-center">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 flex items-center justify-center bg-white border-2 rounded-lg shadow-sm text-xl font-bold" style={{ borderColor: color, color }}>
            {timeLeft.days.toString().padStart(2, '0')}
          </div>
          <span className="text-xs text-slate-500 mt-1 font-medium uppercase">Ngày</span>
        </div>
        <div className="text-2xl font-bold mt-2" style={{ color }}>:</div>
        
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 flex items-center justify-center bg-white border-2 rounded-lg shadow-sm text-xl font-bold" style={{ borderColor: color, color }}>
            {timeLeft.hours.toString().padStart(2, '0')}
          </div>
          <span className="text-xs text-slate-500 mt-1 font-medium uppercase">Giờ</span>
        </div>
        <div className="text-2xl font-bold mt-2" style={{ color }}>:</div>

        <div className="flex flex-col items-center">
          <div className="w-14 h-14 flex items-center justify-center bg-white border-2 rounded-lg shadow-sm text-xl font-bold" style={{ borderColor: color, color }}>
            {timeLeft.minutes.toString().padStart(2, '0')}
          </div>
          <span className="text-xs text-slate-500 mt-1 font-medium uppercase">Phút</span>
        </div>
        <div className="text-2xl font-bold mt-2" style={{ color }}>:</div>

        <div className="flex flex-col items-center">
          <div className="w-14 h-14 flex items-center justify-center bg-white border-2 rounded-lg shadow-sm text-xl font-bold" style={{ borderColor: color, color }}>
            {timeLeft.seconds.toString().padStart(2, '0')}
          </div>
          <span className="text-xs text-slate-500 mt-1 font-medium uppercase">Giây</span>
        </div>
      </div>
    </div>
  );
};
