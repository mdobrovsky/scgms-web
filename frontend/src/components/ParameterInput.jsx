import {Form} from "react-bootstrap";
import PropTypes from "prop-types";

const ParameterInput = ({parameter, signals, models, solvers, selectedModel, setSelectedModel}) => {
    switch (parameter.parameter_type) {
        case "ptBool":
            return <Form.Check type="switch" id={parameter.ui_parameter_name}/>;
        case "ptRatTime":
            return <Form.Control id={parameter.ui_parameter_name} type="time" step={1}/>;
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
        case "ptSignal_Model_Id":
            return (
                <Form.Select id={parameter.ui_parameter_name}
                             onChange={(e) =>
                                 setSelectedModel(models.find((model) => model.id === e.target.value))}>
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
                <Form.Select id={parameter.ui_parameter_name}
                             onChange={(e) =>
                                 setSelectedModel(models.find((model) => model.id === e.target.value))}>
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
                <Form.Select id={parameter.ui_parameter_name}
                             >
                    <option value="">Select a solver...</option>
                    {solvers.map((solver) => (
                        <option key={solver.id} value={solver.id}>
                            {solver.description}
                        </option>
                    ))}
                </Form.Select>
            );
        case "ptModel_Produced_Signal_Id":
            if (!selectedModel) {
                return <Form.Control disabled value="Select a model first"/>;
            }
            console.log("Selected model: ", selectedModel);
            var producedSignals = signals.filter((signal) =>
                selectedModel.calculated_signal_ids.includes(signal.id)
            );
            console.log("Produced signals: ", producedSignals);


            return (
                <Form.Select id={parameter.ui_parameter_name}>
                    <option value="">Select a signal...</option>
                    {producedSignals.map((signal) => (
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

ParameterInput.propTypes = {
    parameter: PropTypes.shape({
        parameter_type: PropTypes.string.isRequired,
        ui_parameter_name: PropTypes.string.isRequired,
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
    selectedModel: PropTypes.shape({
        id: PropTypes.string,
        calculated_signal_ids: PropTypes.arrayOf(PropTypes.string),
    }),
    setSelectedModel: PropTypes.func.isRequired,
};

export default ParameterInput;

