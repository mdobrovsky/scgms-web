import React from "react";
import {Modal, Button, Container, Row, Col, Form} from "react-bootstrap";
import ParameterInput from "./ParameterInput";

const FilterConfigModal = ({filter, show, onClose, signals, models, solvers, selectedModel, setSelectedModel}) => {
    if (!filter) return null;

    return (
        <Modal size="lg" show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Configure <b>{filter.description}</b></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    {filter.parameters.map((parameter, index) => (
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

export default FilterConfigModal;
