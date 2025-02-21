/* eslint-disable react/prop-types */
import React from "react";
import { Form } from "react-bootstrap";

const ParameterInput = ({ parameter, signals }) => {
    switch (parameter.parameter_type) {
        case "ptBool":
            return (
                <Form.Check
                    type="switch"
                    id={parameter.ui_parameter_name}
                    label=""
                />
            );
        case "ptInt64":
        case "ptDouble":
            return (
                <Form.Control
                    id={parameter.ui_parameter_name}
                    type="number"
                    placeholder={parameter.ui_parameter_name}
                />
            );
        case "ptWChar_Array":
            return (
                <Form.Control
                    id={parameter.ui_parameter_name}
                    type="text"
                    placeholder={parameter.ui_parameter_name}
                />
            );
        case "ptSignal_Id":
            return (
                <Form.Select
                    id={parameter.ui_parameter_name}
                    type="text"
                    placeholder={parameter.ui_parameter_name}
                >
                    <option>Choose signal</option>
                    {signals.sort((a, b) => a.signal_description.localeCompare(b.signal_description))
                        .map((signal) => (
                        <option key={signal.id} value={signal.id}>
                            {signal.signal_description}
                        </option>
                    ))}
                </Form.Select>
            );
        default:
            return (
                <Form.Control
                    id={parameter.ui_parameter_name}
                    type="text"
                    placeholder={`Unsupported type: ${parameter.parameter_type}`}
                    disabled
                />
            );
    }
};

export default ParameterInput;
