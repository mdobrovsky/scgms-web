import React from "react";
import { Modal, Button, Container } from "react-bootstrap";
import ParameterInput from "./ParameterInput";

const FilterConfigModal = ({ filter, show, onClose }) => {
    if (!filter) return null;

    return (
        <Modal size="lg" show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Configure <b>{filter.description}</b></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    {filter.parameters.map((param, index) => (
                        <ParameterInput key={index} parameter={param} />
                    ))}
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Close</Button>
                <Button variant="primary">Save</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default FilterConfigModal;
