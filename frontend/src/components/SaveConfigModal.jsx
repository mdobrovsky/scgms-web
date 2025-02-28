import React from "react";
import { Modal, Button, Container, Form } from "react-bootstrap";

const SaveConfigModal = ({ show, onClose, onSave, fileName, setFileName, fileNameError }) => {
    return (
        <Modal size="lg" show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Save Configuration</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form.Group>
                        <Form.Label>Configuration File Name</Form.Label>
                        <Form.Control
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            isInvalid={!!fileNameError}
                        />
                        <Form.Control.Feedback type="invalid">{fileNameError}</Form.Control.Feedback>
                    </Form.Group>
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Close</Button>
                <Button variant="primary" onClick={onSave}>Download Configuration</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SaveConfigModal;
