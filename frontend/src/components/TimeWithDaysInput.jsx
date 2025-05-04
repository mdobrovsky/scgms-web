import React, { useState, useEffect } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import PropTypes from "prop-types";
import convertDoubleToTimeParts from "../services/utils.jsx";
/**
 * TimeWithDaysInput.jsx
 *
 * Composite input component for entering time in days and hh:mm:ss format.
 * Converts input to a single numeric value in days.
 */

const pad = (num) => String(num).padStart(2, "0");



const TimeWithDaysInput = ({ value, onChange, id, name, step = 1 }) => {
    const { days, hours, minutes, seconds } = convertDoubleToTimeParts(value);

    const [localDays, setLocalDays] = useState(days);
    const [timeStr, setTimeStr] = useState(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);

    useEffect(() => {
        const { days, hours, minutes, seconds } = convertDoubleToTimeParts(value);
        setLocalDays(days);
        setTimeStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    }, [value]);

    const handleDaysChange = (e) => {
        const newDays = Number(e.target.value);
        setLocalDays(newDays);
        updateTotal(newDays, timeStr);
    };

    const handleTimeChange = (e) => {
        const newTimeStr = e.target.value;
        setTimeStr(newTimeStr);
        updateTotal(localDays, newTimeStr);
    };

    const updateTotal = (days, timeStr) => {
        const parts = timeStr.split(":").map(Number);
        if (parts.length === 3) {
            const [h, m, s] = parts;
            const totalDays = days + h / 24 + m / 1440 + s / 86400;
            if (onChange) {
                onChange(totalDays);
            }
        }
    };

    return (
        <Container className="p-0">
            <Row className="g-2">
                <Col xs={12} sm={4}>
                    <Form.Control
                        type="number"
                        id={`${id}-days`}
                        name={`${name}-days`}
                        min="0"
                        value={localDays}
                        onChange={handleDaysChange}
                    />
                </Col>
                <Col xs={12} sm={8}>
                    <Form.Control
                        id={id}
                        name={name}
                        type="time"
                        step={step}
                        value={timeStr}
                        onChange={handleTimeChange}
                    />
                </Col>
            </Row>
        </Container>
    );
};

TimeWithDaysInput.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    id: PropTypes.string,
    name: PropTypes.string,
    onChange: PropTypes.func,
    step: PropTypes.number,
};

export default TimeWithDaysInput;
