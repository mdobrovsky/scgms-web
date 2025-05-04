import React from "react";
import {Modal, Button, Container, Form, InputGroup} from "react-bootstrap";
import PropTypes from "prop-types";
/**
 * SaveConfigModal.jsx
 *
 * Modal dialog for entering and validating a configuration file name before downloading.
 * Validates input to prevent empty names and illegal characters, and appends `.ini` extension.
 */

const SaveConfigModal = ({show, onClose, onSave, fileName, setFileName, fileNameError, setFileNameError}) => {
    const validateFileName = (name) => {
        if (!name) {
            return "File name cannot be empty.";
        }
        if (name.length > 50) {
            return "File name is too long (max 50 characters).";
        }
        if (/[/\\:*!?"<>|]/.test(name)) {
            return "File name contains invalid characters: \\/:*?!\"<>|";
        }
        return ''; // no error
    };
    const handleFileNameChange = (e) => {
        const newFileName = e.target.value;
        setFileName(newFileName);
        setFileNameError(validateFileName(newFileName));
    };
    return (
        <Modal size="lg" show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Save Configuration</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form.Group>
                        <Form.Label>Configuration File Name</Form.Label>
                        <InputGroup>
                            <Form.Control
                                type="text"
                                value={fileName}
                                onChange={handleFileNameChange}
                                isInvalid={!!fileNameError}
                            />
                            <InputGroup.Text>.ini</InputGroup.Text>
                        </InputGroup>
                        <Form.Control.Feedback type="invalid">{fileNameError}</Form.Control.Feedback>
                        <Form.Text muted>
                            Enter the name of the configuration file (without extension). Avoid special
                            characters.
                        </Form.Text>
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

SaveConfigModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    fileName: PropTypes.string.isRequired,
    setFileName: PropTypes.func.isRequired,
    fileNameError: PropTypes.string,
    setFileNameError: PropTypes.func.isRequired,
}

export default SaveConfigModal;
