import {Modal, Button, Container, Row, Col, Form, Spinner} from "react-bootstrap";
import ParameterInput from "./ParameterInput";
import PropTypes from "prop-types";
import {useRef, useEffect, useState} from "react";
import {configureFilter} from "../services/filterService";

const FilterConfigModal = ({
                               filter, setFilter, show, onClose, signals, models,
                               solvers, selectedModel, setSelectedModel, setSelectedFilters
                           }) => {
    const formRef = useRef(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        console.log("FilterConfigModal: ", filter);
    });


    if (!filter) return null;

    const handleSaveChanges = async () => {
        if (!formRef.current) return;

        const newParameters = filter.parameters.map((param) => {
            const element = formRef.current.elements[param.config_parameter_name];

            let value;
            if (!element) {
                return {...param};
            }

            switch (param.parameter_type) {
                case "ptBool":
                    value = element.checked ? "true" : "false";
                    break;
                case "ptSignal_Id":
                case "ptSignal_Model_Id":
                case "ptDiscrete_Model_Id":
                case "ptSolver_Id":
                case "ptModel_Produced_Signal_Id":
                    value = element.value || "";
                    break;
                default:
                    value = element.value;
                    break;
            }

            return {...param, value};
        });

        const updatedFilter = {...filter, parameters: newParameters};

        setSelectedFilters((prevFilters) =>
            prevFilters.map((f) => (f.id === updatedFilter.id ? updatedFilter : f))
        );

        setFilter(updatedFilter);
        setLoading(true);
        await configureFilter(updatedFilter).then((result) => {
            if (result === "0") {
                console.log("Filter configured successfully!");
            } else {
                console.error("Error configuring filter:", result);
            }
        });
        setLoading(false);


        onClose();
    };

    return (
        <Modal size="lg" show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Configure <b>{filter.description}</b></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form ref={formRef}>
                        {filter.parameters.filter((parameter) => parameter.parameter_type !== "ptNull")
                            .map((parameter, index) => (
                                <Container key={index} className="flex-column">
                                    <Row style={{paddingTop: "10px"}}>
                                        <Col xs={6} md={6}>
                                            <p>{parameter.ui_parameter_name}</p>
                                            <p className="small text-muted">{parameter.ui_parameter_tooltip ? (parameter.ui_parameter_tooltip) : ("")}</p>
                                        </Col>
                                        <Col lg={6} md={6}>
                                            <ParameterInput parameter={parameter}
                                                            signals={signals}
                                                            models={models}
                                                            solvers={solvers}
                                                            selectedModel={selectedModel}
                                                            setSelectedModel={setSelectedModel}
                                                            setFilter={setFilter}
                                                            filter={filter}
                                            />
                                            <Form.Text id={parameter.ui_parameter_name} muted>
                                                {parameter.parameter_type}
                                            </Form.Text>
                                        </Col>
                                        <hr/>
                                    </Row>
                                </Container>
                            ))}
                    </Form>
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Close</Button>
                <Button variant="outline-dark" onClick={handleSaveChanges}>
                    Save changes {loading && <Spinner animation="border" role="status" size="sm"/>}

                </Button>
            </Modal.Footer>
        </Modal>
    );
};


FilterConfigModal.propTypes = {
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
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
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
    setFilter: PropTypes.func.isRequired,
    setSelectedFilters: PropTypes.func.isRequired,
};
export default FilterConfigModal;
