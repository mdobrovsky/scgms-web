import {Modal, Button, Container, Row, Col, Form} from "react-bootstrap";
import ParameterInput from "./ParameterInput";
import PropTypes from "prop-types";

const FilterConfigModal = ({filter, show, onClose, signals, models, solvers, selectedModel, setSelectedModel}) => {
    if (!filter) return null;

    return (
        <Modal size="lg" show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Configure <b>{filter.description}</b></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
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
                                    />
                                    <Form.Text id={parameter.ui_parameter_name} muted>
                                        {parameter.parameter_type}
                                    </Form.Text>
                                </Col>
                                <hr/>
                            </Row>
                        </Container>
                    ))}
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Close</Button>
                <Button variant="outline-dark">Save changes</Button>
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
};
export default FilterConfigModal;
