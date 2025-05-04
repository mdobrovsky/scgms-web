import React from "react";
import {Modal, Button, Container, Form} from "react-bootstrap";
import {toast} from "react-toastify";
import PropTypes from "prop-types";

/**
 * LoadConfigModal.jsx
 *
 * Modal dialog for uploading a configuration file (.ini) and optional CSV files.
 * Validates file types and enables the load button accordingly.
 */

const LoadConfigModal = ({show, onClose, setConfigFile, setCsvFiles, onLoad}) => {
    const [isLoadDisabled, setIsLoadDisabled] = React.useState(true);

    // useffect
    React.useEffect(() => {
        setIsLoadDisabled(true);
    } , [show]);

    const handleFileChange = (files) => {
        const configFile = Array.from(files).find(file => file.name.endsWith('.ini'));
        if (!configFile) {
            setIsLoadDisabled(true);
            toast.error("Please select a configuration file with .ini extension");
            return;
        }
        setIsLoadDisabled(false);
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
                <Button variant="primary" disabled={isLoadDisabled} onClick={onLoad}>Load</Button>
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
