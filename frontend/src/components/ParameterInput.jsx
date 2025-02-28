import React from "react";
import {Form} from "react-bootstrap";

const ParameterInput = ({parameter, signals}) => {
    switch (parameter.parameter_type) {
        case "ptBool":
            return <Form.Check type="switch" id={parameter.ui_parameter_name}/>;
        case "ptInt64":
        case "ptDouble":
            return <Form.Control id={parameter.ui_parameter_name} type="number"/>;
        case "ptWChar_Array":
            return <Form.Control id={parameter.ui_parameter_name} type="text"/>;
        case "ptSignal_Id":
            return (
                <Form.Select id={parameter.ui_parameter_name}>
                    <option value="">Select a signal...</option>
                    {signals.map((signal) => (
                        <option key={signal.id} value={signal.id}>
                            {signal.signal_description}
                        </option>
                    ))}
                </Form.Select>
            );
        default:
            return <Form.Control disabled value={`Unsupported: ${parameter.parameter_type}`}/>;
    }
};

export default ParameterInput;
