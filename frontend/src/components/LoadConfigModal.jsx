import React from "react";
import {Modal, Button, Container, Form, InputGroup} from "react-bootstrap";
import PropTypes from "prop-types";

const LoadConfigModal = ({show, onClose, setFile, onLoad}) => {


    return (
        <Modal size="lg" show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Load Configuration</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form>
                        <Form.Group controlId="formFile" className="mb-3">
                            <Form.Label>Select configuration file to load</Form.Label>
                            <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])}
                            />
                        </Form.Group>
                    </Form>
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Close</Button>
                <Button variant="primary" onClick={onLoad}>Load</Button>
            </Modal.Footer>
        </Modal>
    );
};
LoadConfigModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    setFile: PropTypes.func.isRequired,
    onLoad: PropTypes.func.isRequired,
}

export default LoadConfigModal;
