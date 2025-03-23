import React, {useState, useEffect} from "react";
import {Col, Container, Form, InputGroup, Row} from "react-bootstrap";
import PropTypes from "prop-types";
const convertDoubleToTimeParts = (value) => {
    const totalHours = Number(value) || 0;
    const totalSeconds = Math.round(totalHours * 3600);

    const days = Math.floor(totalSeconds / (24 * 3600));
    const dayRemainder = totalSeconds % (24 * 3600);

    const hours = Math.floor(dayRemainder / 3600);
    const minutes = Math.floor((dayRemainder % 3600) / 60);
    const seconds = dayRemainder % 60;
    console.log("Converting:", value, "to", { days, hours, minutes, seconds });

    return { days, hours, minutes, seconds };
};
const TimeWithDaysInput = ({value, onChange, id, name, step = 1, ...rest}) => {
    const { days, hours, minutes, seconds } = convertDoubleToTimeParts(value);


    const pad = (num) => String(num).padStart(2, "0");
    const initialTimeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    const [localDays, setLocalDays] = useState(days);
    const [timeStr, setTimeStr] = useState(initialTimeStr);



    useEffect(() => {
        const newTotal = Number(value) || 0;
        const newDays = Math.floor(newTotal / 24);
        const newRemainder = newTotal - newDays * 24;
        const newHours = Math.floor(newRemainder);
        const newMinutes = Math.floor((newRemainder - newHours) * 60);
        const newSeconds = Math.floor((((newRemainder - newHours) * 60) - newMinutes) * 60);
        setLocalDays(newDays);
        setTimeStr(`${pad(newHours)}:${pad(newMinutes)}:${pad(newSeconds)}`);
    }, [value]);

    const handleDaysChange = (e) => {
        const newDays = Number(e.target.value) || 0;
        setLocalDays(newDays);
        const parts = timeStr.split(":");
        if (parts.length === 3) {
            const newHours = parseInt(parts[0], 10);
            const newMinutes = parseInt(parts[1], 10);
            const newSeconds = parseInt(parts[2], 10);
            const newTotal = newDays * 24 + newHours + newMinutes / 60 + newSeconds / 3600;
            if (onChange) {
                onChange(newTotal);
            }
        }
    };

    const handleTimeChange = (e) => {
        const newTimeStr = e.target.value;
        setTimeStr(newTimeStr);
        const parts = newTimeStr.split(":");
        if (parts.length === 3) {
            const newHours = parseInt(parts[0], 10);
            const newMinutes = parseInt(parts[1], 10);
            const newSeconds = parseInt(parts[2], 10);
            const newTotal = localDays * 24 + newHours + newMinutes / 60 + newSeconds / 3600;
            if (onChange) {
                onChange(newTotal);
            }
        }
    };

    return (
        <Container className="p-0">
            <Row className="g-2">
                <Col xs={12} sm={12} md={4}>
                    <Form.Control
                        type="number"
                        id="days"
                        name="days"
                        min="0"
                        value={localDays}
                        onChange={handleDaysChange}
                        // style={{ width: "100%", maxWidth: "100px" }}
                    />
                </Col>
                <Col xs={12} sm={12} md={8}>
                    <Form.Control
                        id={id}
                        name={name}
                        type="time"
                        value={timeStr}
                        step={step}
                        onChange={handleTimeChange}
                        // style={{ width: "100%", maxWidth: "100px" }}
                    />
                </Col>
            </Row>
        </Container>
    );
};

TimeWithDaysInput.propTypes = {
    value: PropTypes.string.isRequired,
    id: PropTypes.string,
    name: PropTypes.string,
    onChange: PropTypes.func,
    step: PropTypes.number,
};

export default TimeWithDaysInput;
