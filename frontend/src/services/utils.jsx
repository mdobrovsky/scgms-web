const convertDoubleToTimeParts = (value) => {
    const totalSeconds = Math.round(Number(value || 0) * 86400); // 1 den = 86400 sekund

    const days = Math.floor(totalSeconds / 86400);
    const remainder = totalSeconds % 86400;

    const hours = Math.floor(remainder / 3600);
    const minutes = Math.floor((remainder % 3600) / 60);
    const seconds = remainder % 60;

    return { days, hours, minutes, seconds };
};

export const updateFilterIndexes = (filters) => {
    return filters.map((f, i) => ({ ...f, index: i.toString() }));
};

export default convertDoubleToTimeParts;