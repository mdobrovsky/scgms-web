import React from "react";
import {Modal, Button, Container, Form, InputGroup} from "react-bootstrap";
import PropTypes from "prop-types";

const LoadConfigModal = ({show, onClose, setConfigFile, setCsvFiles, onLoad}) => {

    const handleFileChange = (files) => {
        const configFile = Array.from(files).find(file => file.name.endsWith('.ini'));
        const csvFiles = Array.from(files).filter(file => file.name.endsWith('.csv'));
        if (configFile) {
            setConfigFile(configFile);
        }
        if (csvFiles.length > 0) {
            setCsvFiles(csvFiles);
        }
    }

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
                            <Form.Control type="file" multiple onChange={(e) =>
                                handleFileChange(e.target.files)}
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
    setConfigFile: PropTypes.func.isRequired,
    setCsvFiles: PropTypes.func.isRequired,
    onLoad: PropTypes.func.isRequired,
}

export default LoadConfigModal;
