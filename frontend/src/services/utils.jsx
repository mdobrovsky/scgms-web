const convertDoubleToTime = (doubleValue) => {
    const days = Math.floor(doubleValue / 24);
    const hours = Math.floor(doubleValue % 24);
    const minutes = Math.floor((doubleValue % 1) * 60);
    const seconds = Math.floor((doubleValue % 1) * 60 % 1 * 60);
    return [days,
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`];
}

export default convertDoubleToTime;