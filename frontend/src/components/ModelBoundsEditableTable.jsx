import React, {useEffect, useState} from "react";
import {Table, Form, Container, Button} from "react-bootstrap";
import PropTypes from "prop-types";
import TimeWithDaysInput from "./TimeWithDaysInput.jsx";

const ResetType = {
    LOWER: "lower",
    DEFAULT: "default",
    UPPER: "upper"
};

/**
 * ModelBoundsEditableTable.jsx
 *
 * Component for editing lower, default, and upper bounds of model parameters in a tabular form.
 * Supports both numeric and time-based inputs. On change, emits serialized bounds string.
 */

const ModelBoundsEditableTable = ({model, values, onBoundsChange}) => {
    const rowCount = model?.number_of_parameters || 0;

    const [bounds, setBounds] = useState([]);

    useEffect(() => {
        console.log("Values changed, reloading table...", values);
    }, [values]);


    useEffect(() => {
        console.log("Model bounds changed:", values);
        const deserializeBounds = (boundsString) => {
            if (boundsString === "" || !boundsString) {
                return null;
            }
            const boundsArray = boundsString.split(" ").map(Number);
            const lower = boundsArray.slice(0, rowCount);
            const defaultVals = boundsArray.slice(rowCount, rowCount * 2);
            const upper = boundsArray.slice(rowCount * 2, rowCount * 3);
            return {lower, defaultVals, upper};
        }
        const deserializedBounds = deserializeBounds(values);
        console.log("Deserialized bounds:", deserializedBounds);
        const initialBounds = Array.from({length: rowCount}, (_, index) => ({
            lower: deserializedBounds ? deserializedBounds.lower[index] : model.lower_bound[index],
            default: deserializedBounds ? deserializedBounds.defaultVals[index] : model.default_values[index],
            upper: deserializedBounds ? deserializedBounds.upper[index] : model.upper_bound[index],
        }));
        setBounds(initialBounds);
    }, [values]);


    const handleInputChange = (index, type, value) => {
        const updatedBounds = [...bounds];

        const parsedValue = model.parameter_types[index] === "mptDouble" || model.parameter_types[index] === "mptTime"
            ? parseFloat(value)
            : value;

        updatedBounds[index][type] = parsedValue;

        setBounds(updatedBounds);

    };

    const handleStoreClick = () => {
        const lower = bounds.map(b => {
            const val = parseFloat(b.lower);
            return isNaN(val) ? model.lower_bound[bounds.indexOf(b)] : val;
        });
        const defaultVals = bounds.map(b => {
            const val = parseFloat(b.default);
            return isNaN(val) ? model.default_values[bounds.indexOf(b)] : val;
        });
        const upper = bounds.map(b => {
            const val = parseFloat(b.upper);
            return isNaN(val) ? model.upper_bound[bounds.indexOf(b)] : val;
        });
        const boundsString = [...lower, ...defaultVals, ...upper].join(" ");
        if (onBoundsChange) {
            onBoundsChange({
                boundsString
            });
        }
    };

    const handlePartialResetClick = (type) => {
        const initialBounds = Array.from({length: rowCount}, (_, index) => {
            const bound = { ...bounds[index] };
            switch (type) {
                case ResetType.LOWER:
                    bound.lower = model.lower_bound[index];
                    break;
                case ResetType.DEFAULT:
                    bound.default = model.default_values[index];
                    break;
                case ResetType.UPPER:
                    bound.upper = model.upper_bound[index];
                    break;
                default:
                    break;
            }
            return bound;
        });

        setBounds(initialBounds);
    };

    const getType = (modelType) => {
        switch (modelType) {
            case "mptDouble":
                return "number";
            case "mptTime":
                return "time";
            default:
                return "text";
        }
    };

    return (
        <Container className="mt-3">
            <h4>Model bounds</h4>
            <Table bordered hover>
                <thead>
                <tr>
                    <th></th>
                    <th>Lower bounds</th>
                    <th>Default values</th>
                    <th>Upper bounds</th>
                </tr>
                </thead>
                <tbody>
                {bounds.map((bound, rowIndex) => (
                    <tr key={rowIndex}>
                        <td>{model.parameter_ui_names[rowIndex]}</td>
                        <td>
                            {getType(model.parameter_types[rowIndex]) === "time" ? (
                                <TimeWithDaysInput
                                    value={isNaN(bound.lower) ? "" : bound.lower.toString()}
                                    onChange={(newValue) =>
                                        handleInputChange(rowIndex, "lower", newValue)
                                    }
                                />
                            ) : (
                                <Form.Control
                                    type={getType(model.parameter_types[rowIndex])}
                                    value={isNaN(bound.lower) ? "" : bound.lower}
                                    onChange={(e) =>
                                        handleInputChange(rowIndex, "lower", e.target.value)
                                    }
                                />
                            )}
                        </td>
                        <td>
                            {getType(model.parameter_types[rowIndex]) === "time" ? (
                                <TimeWithDaysInput
                                    value={isNaN(bound.default) ? "" : bound.default.toString()}
                                    onChange={(newValue) =>
                                        handleInputChange(rowIndex, "default", newValue)
                                    }
                                />
                            ) : (
                                <Form.Control
                                    type={getType(model.parameter_types[rowIndex])}
                                    value={isNaN(bound.default) ? "" : bound.default}
                                    onChange={(e) =>
                                        handleInputChange(rowIndex, "default", e.target.value)
                                    }
                                />
                            )}
                        </td>
                        <td>
                            {getType(model.parameter_types[rowIndex]) === "time" ? (
                                <TimeWithDaysInput
                                    value={isNaN(bound.upper) ? "" : bound.upper.toString()}
                                    onChange={(newValue) =>
                                        handleInputChange(rowIndex, "upper", newValue)
                                    }
                                />
                            ) : (
                                <Form.Control
                                    type={getType(model.parameter_types[rowIndex])}
                                    value={isNaN(bound.upper) ? "" : bound.upper}
                                    onChange={(e) =>
                                        handleInputChange(rowIndex, "upper", e.target.value)
                                    }
                                />
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </Table>
            <Container className="d-flex justify-content-start gap-2 px-0 mt-3">
                <Button variant="dark" onClick={handleStoreClick}>
                    Store Parameters
                </Button>
                <Button variant="outline-secondary" onClick={() => handlePartialResetClick(ResetType.LOWER)}>
                    Reset lower bounds
                </Button>
                <Button variant="outline-secondary" onClick={() => handlePartialResetClick(ResetType.DEFAULT)}>
                    Reset default parameters
                </Button>
                <Button variant="outline-secondary" onClick={() => handlePartialResetClick(ResetType.UPPER)}>
                    Reset upper bounds
                </Button>
            </Container>
        </Container>
    );
};

ModelBoundsEditableTable.propTypes = {
    model: PropTypes.shape({
        number_of_parameters: PropTypes.number.isRequired,
        lower_bound: PropTypes.arrayOf(PropTypes.number).isRequired,
        default_values: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired,
        upper_bound: PropTypes.arrayOf(PropTypes.number).isRequired,
        parameter_types: PropTypes.arrayOf(PropTypes.string).isRequired,
        parameter_ui_names: PropTypes.arrayOf(PropTypes.string).isRequired,
    }).isRequired,
    values: PropTypes.string,
    onBoundsChange: PropTypes.func,
};

export default ModelBoundsEditableTable;
