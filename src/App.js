import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

const App = () => {
    const daysInMonth = 31;
    const monthlyTargetMinutes: number = 182 * 60;
    const extraThresholdMinutes: number = 9 * 60;

    const loadInitialHours = (): any[] | any => {
        const saved: string = localStorage.getItem('workHours');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length === daysInMonth) {
                    return parsed;
                }
            } catch {}
        }
        return Array(daysInMonth).fill('');
    };

    const [hours, setHours] = useState(loadInitialHours);

    useEffect((): void => {
        localStorage.setItem('workHours', JSON.stringify(hours));
    }, [hours]);

    const isValidTime = (value): boolean => {
        if (!value) return false;
        const timePattern = /^([0-9]|0[0-9]|1[0-1]):[0-5][0-9]$/;
        return timePattern.test(value);
    };

    const formatInput = (value): * | string => {
        const digits = value.replace(/\D/g, '');

        if (digits.length <= 2) {
            return digits;
        } else if (digits.length <= 4) {
            return `${digits.slice(0, 2)}:${digits.slice(2)}`;
        } else {
            return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
        }
    };

    const resetHours = (): void => {
        setHours(Array(daysInMonth).fill(''));
        localStorage.removeItem('workHours');
    };

    const handleChange = (index, rawValue): void => {
        const formatted = formatInput(rawValue);
        const newHours: *[] = [...hours];
        newHours[index] = formatted;
        setHours(newHours);
    };

    const workedMinutesPerDay: (null | *)[] = useMemo(() => {
        return hours.map((time): * | null => {
            if (!isValidTime(time)) return null;
            const [h, m] = time.split(':').map(Number);
            if (isNaN(h) || isNaN(m)) return null;
            return h * 60 + m;
        });
    }, [hours]);

    const deficitAfterExtra = useMemo(() => {
        return hours.reduce((total, time) => {
            if (!isValidTime(time)) return total;
            const [h, m] = time.split(':').map(Number);
            const minutes = h * 60 + m;
            const diff: number = minutes - extraThresholdMinutes;
            return total + diff;
        }, 0);
    }, [hours]);



    const totalMinutes = workedMinutesPerDay.reduce((total, mins) => mins !== null ? total + mins : total, 0);

    const daysWithValidInput = workedMinutesPerDay.reduce((count, mins) => mins !== null ? count + 1 : count, 0);

    const adjustedMinutes: number = Math.max(0, totalMinutes - daysWithValidInput * 30);

    const remainingToTargetMinutes: number = Math.max(0, monthlyTargetMinutes - totalMinutes);

    const extraOrDeficitPerDay: (number | *)[] = workedMinutesPerDay.map(mins => {
        if (mins === null) return 0;
        return mins - extraThresholdMinutes;
    });

    const totalExtraMinutes = extraOrDeficitPerDay.reduce((total, val) => val > 0 ? total + val : total, 0);

    const totalDeficitMinutes: number = Math.abs(extraOrDeficitPerDay.reduce((total, val) => val < 0 ? total + val : total, 0));

    const deficitMinutes: number = totalMinutes >= monthlyTargetMinutes ? 0 : Math.max(0, -deficitAfterExtra);

    const netExtraMinutes: number = totalMinutes >= monthlyTargetMinutes ? totalMinutes - monthlyTargetMinutes
        : Math.max(0, totalExtraMinutes - totalDeficitMinutes);


    const formatTime = (minutes): string => {
        const h: number = Math.floor(minutes / 60);
        const m: number = minutes % 60;
        return `${h}:${m.toString().padStart(2, '0')}`;
    };

    const formatExtraDeficit = (mins): string => {
        if (mins === 0) return '-';
        const sign: string = mins > 0 ? '+' : '-';
        const absMins: number = Math.abs(mins);
        const h: number = Math.floor(absMins / 60);
        const m: number = absMins % 60;
        return `${sign}${h}:${m.toString().padStart(2, '0')}`;
    };

    return (
        <div className="app-container">
            <h1>Work Hours Tracker</h1>
            <table className="hours-table">
                <thead>
                <tr>
                    <th>Day</th>
                    <th>Hours Worked</th>
                    <th>Extra / Deficit</th>
                </tr>
                </thead>
                <tbody>
                {Array.from({length: daysInMonth}, (_, i: number) => (
                    <tr key={i}>
                        <td>{i + 1}</td>
                        <td>
                            <input
                                type="text"
                                placeholder="09:00"
                                maxLength={5}
                                value={hours[i]}
                                onChange={(e): void => handleChange(i, e.target.value)}
                                className={isValidTime(hours[i]) ? '' : 'invalid'}
                            />
                        </td>
                        <td style={{
                            textAlign: 'center',
                            fontWeight: '600',
                            color: extraOrDeficitPerDay[i] > 0 ? 'green' : (extraOrDeficitPerDay[i] < 0 ? 'red' : 'gray')
                        }}>
                            {formatExtraDeficit(extraOrDeficitPerDay[i])}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div className="summary-line">
                <svg className="summary-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor">
                    <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                </svg>
                <span>Total hours in work (hilanet): {formatTime(totalMinutes)}</span>
            </div>

            <div className="summary-line">
                <svg className="summary-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor">
                    <path d="M12 8v4l3 3" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                </svg>
                <span>Total hours minus 30 min (focus): {formatTime(adjustedMinutes)}</span>
            </div>

            <div className="summary-line">
                <svg className="summary-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor">
                    <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                </svg>
                <span>Remaining to reach 182h target: {formatTime(remainingToTargetMinutes)}</span>
            </div>

            <div className="summary-line">
                <svg className="summary-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor">
                    <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                </svg>
                <span>Total extra hours : {formatTime(netExtraMinutes)}</span>
            </div>

            <div className="summary-line">
                <svg className="summary-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                    <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                </svg>
                <span>Total days worked: {daysWithValidInput}</span>
            </div>

            <div className="summary-line">
                <svg className="summary-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor">
                    <path d="M19 14l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3v18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Total deficit after extra applied:{" "}
                    <span style={{color: deficitMinutes > 0 ? "red" : "inherit"}}>
                        {formatTime(deficitMinutes)}</span>
                </span>
            </div>

            <div className="reset-container">
                <button className="reset-button" onClick={resetHours}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 4v5h.582m15.827-2.292A9.969 9.969 0 0112 20c-5.523 0-10-4.477-10-10h2a8 8 0 1014.485-5.292z"
                        />
                    </svg>
                    Reset Calculator
                </button>
            </div>
        </div>
    );
};

export default App;
