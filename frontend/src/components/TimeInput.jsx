import React from "react";
import { Form } from "react-bootstrap";
import PropTypes from "prop-types";

const TimeInput = ({ id, name, value, onChange, step = 1 }) => {
    return (
        <Form.Control
            id={id}
            type="time"
            name={name}
            value={value}
            step={step}
            onChange={onChange}
        />
    );
};

TimeInput.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    step: PropTypes.number,
};

export default TimeInput;
