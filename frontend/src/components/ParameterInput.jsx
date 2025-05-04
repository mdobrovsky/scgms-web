import {Form} from "react-bootstrap";
import PropTypes from "prop-types";
import React, {useEffect} from "react";
import convertDoubleToTime from "../services/utils";
import TimeWithDaysInput from "./TimeWithDaysInput.jsx";
/**
 * ParameterInput.jsx
 *
 * Dynamically renders appropriate form input based on the filter parameter type.
 * updates filter state, and handles interactions such as model selection or CSV file input.
 *
 */

const pad = (num) => String(num).padStart(2, "0");

function getOnChangeParameter(setFilter, parameter) {
    return (e) => {
        setFilter((prevFilter) => ({
            ...prevFilter,
            parameters: prevFilter.parameters.map((p) =>
                p.config_parameter_name === parameter.config_parameter_name
                    ? {...p, value: e.target.value}
                    : p
            ),
        }));
    };
}


const ParameterInput = ({
                            parameter, signals, models, solvers, metrics,
                            selectedModel, setSelectedModel, setFilter, filter, setCsvFiles
                        }) => {

        const selectedModelId = filter.parameters.find((p) =>
            p.parameter_type === "ptDiscrete_Model_Id" || p.parameter_type === "ptSignal_Model_Id"
        )?.value;

        const onChangeTime = (value) => {
            setFilter((prevFilter) => ({
                ...prevFilter,
                parameters: prevFilter.parameters.map((p) =>
                    p.config_parameter_name === parameter.config_parameter_name
                        ? {...p, value: value}
                        : p
                ),
            }));
        }

        const handleFileChange = (files) => {
            const csvFiles = Array.from(files).filter(file => file.name.endsWith('.csv'));
            if (csvFiles.length > 0) {
                setCsvFiles(csvFiles);
            }
        }


        useEffect(() => {
            if (selectedModelId) {
                const model = models.find((model) => model.id === selectedModelId);
                setSelectedModel(model);
            }
        }, [selectedModelId, models, setSelectedModel]);

        switch (parameter.parameter_type) {
            case "ptBool":

                return <Form.Check type="switch" id={parameter.config_parameter_name}
                                   name={parameter.config_parameter_name} checked={parameter.value === "true"}
                                   onChange={(e) => {
                                       setFilter((prevFilter) => ({
                                           ...prevFilter,
                                           parameters: prevFilter.parameters.map((p) =>
                                               p.config_parameter_name === parameter.config_parameter_name
                                                   ? {...p, value: e.target.checked ? "true" : "false"}
                                                   : p
                                           ),
                                       }));
                                   }}
                />;

            case "ptRatTime": {
                return <TimeWithDaysInput onChange={onChangeTime} value={parameter.value} step={1}
                                          id={parameter.config_parameter_name} name={parameter.config_parameter_name}
                />
            }

            case "ptInt64":
            case "ptDouble":
                return <Form.Control id={parameter.config_parameter_name} type="number"
                                     name={parameter.config_parameter_name} defaultValue={parameter.value}
                                     onChange={getOnChangeParameter(setFilter, parameter)}
                />;
            case "ptWChar_Array":
                if (filter.description === "CSV File Log Replay") {
                    return <>
                        <Form.Control id={parameter.config_parameter_name} type="text"
                                      name={parameter.config_parameter_name} defaultValue={parameter.value}
                                      onChange={getOnChangeParameter(setFilter, parameter)}
                        />
                        <Form.Group controlId="formFile" className="mb-3">
                            <Form.Control type="file" multiple onChange={(e) =>
                                handleFileChange(e.target.files)}/>
                        </Form.Group>
                    </>
                        ;
                }
                return <Form.Control id={parameter.config_parameter_name} type="text"
                                     name={parameter.config_parameter_name} defaultValue={parameter.value}
                                     onChange={getOnChangeParameter(setFilter, parameter)}
                />;
            case "ptSignal_Id":
                return (
                    <Form.Select id={parameter.config_parameter_name} name={parameter.config_parameter_name}
                                 value={parameter.value}
                                 onChange={(e) => {
                                     setFilter((prevFilter) => ({
                                         ...prevFilter,
                                         parameters: prevFilter.parameters.map((p) =>
                                             p.config_parameter_name === parameter.config_parameter_name
                                                 ? {...p, value: e.target.value}
                                                 : p
                                         ),
                                     }));
                                 }}
                    >
                        <option value="">Select a signal...</option>
                        {signals.map((signal) => (
                            <option key={signal.id} value={signal.id}>
                                {signal.signal_description}
                            </option>
                        ))}
                    </Form.Select>
                );
            case "ptSignal_Model_Id":
                return (
                    <Form.Select
                        id={parameter.config_parameter_name}
                        name={parameter.config_parameter_name}
                        value={parameter.value || ""}
                        onChange={(e) => {
                            const selected = models.find((model) => model.id === e.target.value);
                            setSelectedModel(selected);
                            setFilter((prevFilter) => ({
                                ...prevFilter,
                                parameters: prevFilter.parameters.map((p) =>
                                    p.config_parameter_name === parameter.config_parameter_name
                                        ? {...p, value: e.target.value}
                                        : p
                                ),
                            }));
                        }}
                    >
                        <option value="">Select a model...</option>

                        {models.filter((model) => model.flags === "Signal_Model")
                            .map((model) => (
                                <option key={model.id} value={model.id}>
                                    {model.description}
                                </option>
                            ))}
                    </Form.Select>
                );
            case "ptDiscrete_Model_Id":
                return (
                    <Form.Select
                        id={parameter.config_parameter_name}
                        name={parameter.config_parameter_name}
                        value={parameter.value || ""}
                        onChange={(e) => {
                            const selected = models.find((model) => model.id === e.target.value);
                            setSelectedModel(selected);
                            setFilter((prevFilter) => ({
                                ...prevFilter,
                                parameters: prevFilter.parameters.map((p) =>
                                    p.config_parameter_name === parameter.config_parameter_name
                                        ? {...p, value: e.target.value}
                                        : p
                                ),
                            }));
                        }}
                    >
                        <option value="">Select a model...</option>
                        {models.filter((model) => model.flags === "Discrete_Model")
                            .map((model) => (
                                <option key={model.id} value={model.id}>
                                    {model.description}
                                </option>
                            ))}
                    </Form.Select>
                );
            case "ptSolver_Id":
                return (
                    <Form.Select
                        id={parameter.config_parameter_name}
                        name={parameter.config_parameter_name}
                        value={parameter.value || ""}
                        onChange={(e) => {
                            setFilter((prevFilter) => ({
                                ...prevFilter,
                                parameters: prevFilter.parameters.map((p) =>
                                    p.config_parameter_name === parameter.config_parameter_name
                                        ? {...p, value: e.target.value}
                                        : p
                                ),
                            }));
                        }}
                    >
                        <option value="">Select a solver...</option>
                        {solvers.map((solver) => (
                            <option key={solver.id} value={solver.id}>
                                {solver.description}
                            </option>
                        ))}
                    </Form.Select>
                );
            case "ptMetric_Id": {
                return (
                    <Form.Select
                        id={parameter.config_parameter_name}
                        name={parameter.config_parameter_name}
                        value={parameter.value || ""}
                        onChange={(e) => {
                            setFilter((prevFilter) => ({
                                ...prevFilter,
                                parameters: prevFilter.parameters.map((p) =>
                                    p.config_parameter_name === parameter.config_parameter_name
                                        ? {...p, value: e.target.value}
                                        : p
                                ),
                            }));
                        }}
                    >
                        <option value="">Select a metric...</option>
                        {metrics.map((metric) => (
                            <option key={metric.id} value={metric.id}>
                                {metric.description}
                            </option>
                        ))}
                    </Form.Select>
                );
            }
            case "ptModel_Produced_Signal_Id": {
                // const selectedModelId = filter.parameters.find((p) =>
                //     p.parameter_type === "ptDiscrete_Model_Id" || p.parameter_type === "ptSignal_Model_Id")?.value;
                // if (selectedModelId !== "") {
                //     setSelectedModel(models.find((model) => model.id === selectedModelId));
                // }

                {
                    if (!selectedModel) {
                        return <Form.Control disabled value="Select a model first"/>;
                    }

                    const producedSignals = signals.filter((signal) =>
                        selectedModel.calculated_signal_ids.includes(signal.id)
                    );

                    return (
                        <Form.Select
                            id={parameter.config_parameter_name}
                            name={parameter.config_parameter_name}
                            value={parameter.value || ""}
                            onChange={(e) => {
                                setFilter((prevFilter) => ({
                                    ...prevFilter,
                                    parameters: prevFilter.parameters.map((p) =>
                                        p.config_parameter_name === parameter.config_parameter_name
                                            ? {...p, value: e.target.value}
                                            : p
                                    ),
                                }));
                            }}
                        >
                            <option value="">Select a signal...</option>
                            {producedSignals.map((signal) => (
                                <option key={signal.id} value={signal.id}>
                                    {signal.signal_description}
                                </option>
                            ))}
                        </Form.Select>
                    );
                }
            }
            case "ptNull":
                return <> </>;
            default:
                return <Form.Control disabled value={`Unsupported: ${parameter.parameter_type}`}/>;
        }
    }
;

ParameterInput.propTypes = {
    parameter: PropTypes.shape({
        parameter_type: PropTypes.string.isRequired,
        config_parameter_name: PropTypes.string.isRequired,
        value: PropTypes.any,
    }).isRequired,
    signals: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            signal_description: PropTypes.string.isRequired,
        })
    ).isRequired,
    models: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            flags: PropTypes.string.isRequired,
        })
    ).isRequired,
    solvers: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
        })
    ).isRequired,
    metrics: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
        })
    ).isRequired,
    selectedModel: PropTypes.shape({
        id: PropTypes.string,
        calculated_signal_ids: PropTypes.arrayOf(PropTypes.string),
    }),
    setSelectedModel: PropTypes.func.isRequired,
    setFilter: PropTypes.func.isRequired,
    filter: PropTypes.shape({
        description: PropTypes.string.isRequired,
        parameters: PropTypes.arrayOf(
            PropTypes.shape({
                parameter_type: PropTypes.string.isRequired,
                ui_parameter_name: PropTypes.string.isRequired,
                ui_parameter_tooltip: PropTypes.string,
                value: PropTypes.any,
            })
        ).isRequired,
    }).isRequired,
};

export default ParameterInput;

