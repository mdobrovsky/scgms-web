import {useState, useEffect} from 'react';
import axios from 'axios';
import {Container, Card, Button, ListGroup, Modal, Row, Col, Form, ButtonGroup, Spinner, Alert} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    ADD_FILTER_URL,
    FETCH_FILTERS_URL,
    FETCH_SIGNALS_URL,
    REMOVE_FILTER_URL,
    SAVE_CONFIGURATION_URL
} from './apiConstants.jsx';
import ParameterInput from "./ParameterInput";

// import './FiltersPage.css';

function FiltersPage() {
    const [availableFilters, setAvailableFilters] = useState([]);
    const [availableSignals, setAvailableSignals] = useState([]);
    const [appliedFilters, setAppliedFilters] = useState([]);
    const [selectedFilterIndex, setSelectedFilterIndex] = useState(null);
    const [isParamModalOpen, setIsParamModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [configFileName, setConfigFileName] = useState('');
    const [fileNameError, setFileNameError] = useState('');

    useEffect(() => {
        const fetchSignals = async () => {
            try {
                await axios.get(FETCH_SIGNALS_URL)
                    .then((response) => {
                        setAvailableSignals(response.data.signals);
                        // console.log(response.data.signals);
                    });

            } catch (error) {
                console.error('Error fetching signals:', error);
            }
        }
        const fetchFilters = async () => {
            try {
                await axios.get(FETCH_FILTERS_URL)
                    .then((response) => {
                        setAvailableFilters(response.data.filters);
                        // console.log(response.data.filters);
                    });

            } catch (error) {
                console.error('Error fetching filters:', error);
            }
        };

        fetchSignals();
        fetchFilters();
    }, []);

    useEffect(() => {
        let timer;
        if (isLoading) {
            timer = setTimeout(() => {
                setShowSpinner(true);
            }, 300); // spinner will be shown only after 300ms of loading
        } else {
            setShowSpinner(false);
        }
        return () => clearTimeout(timer);
    }, [isLoading]);


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
        setConfigFileName(newFileName);
        setFileNameError(validateFileName(newFileName));
    };

    const handleShowErrorAlert = (message, error) => {
        setErrorMessage(`${message} ${error}`);
        setShowErrorAlert(true);
        setTimeout(() => setShowErrorAlert(false), 5000);
    }

    const handleAddFilter = (filter) => {
        // send post request to server
        setIsLoading(true);
        const guid_string = filter.id;
        console.log(`Adding filter with ID: ${guid_string}`);
        axios.post(ADD_FILTER_URL, {guid_string})
            .then((response) => {
                console.log('Filter added successfully:', response.data);
                if (response.data.result !== '0') {
                    handleShowErrorAlert("Error while adding a filter.");
                    return;
                }
                setAppliedFilters([...appliedFilters, filter]);
            })
            .catch(error => {
                console.error("Error while adding a filter:", error);
                // show alert
                handleShowErrorAlert("Error while adding a filter:", error);
            })
            .finally(() => {
                console.log('Add filter request completed');
                setIsLoading(false);
            });
    };

    function removeOneFilter(index_to_remove) {
        return axios.post(REMOVE_FILTER_URL, {index: index_to_remove})
            .then((response) => {
                console.log('Filter removed successfully:', response.data);
                if (response.data.result !== '0') {
                    handleShowErrorAlert("Error while removing a filter.");
                    return 1;
                }
                else {
                    console.log('Removing filter at index:', index_to_remove);
                    // setAppliedFilters(appliedFilters.filter((_, index) => index !== index_to_remove));
                    setAppliedFilters(prevFilters =>
                        prevFilters.filter((_, index) => index !== index_to_remove)
                    );
                    return 0;
                }
            })
    }

    const handleRemoveFilter = () => {
        if (selectedFilterIndex !== null) {
            removeOneFilter(selectedFilterIndex).then((res) => {
                if (res === 0) {
                    setSelectedFilterIndex(null);
                }
            })

        }
    };

    const handleSaveConfiguration = () => {
        setIsConfigModalOpen(true);

    }

    const handleConfigureFilter = () => {

        if (selectedFilterIndex !== null) {
            setIsParamModalOpen(true);
        }
    };


    const handleDownload = async () => {
        if (fileNameError || !configFileName) {
            return;
        }
        setIsConfigModalOpen(false);

    };


    const handleRemoveAllFilters = async () => {
        const filtersToRemove = [...appliedFilters];

        for (let i = filtersToRemove.length - 1; i >= 0; i--) {
            const result = await removeOneFilter(i);
            if (result === 1) {
                console.error(`Error removing filter at index ${i}`);
                break;
            }
        }
        setSelectedFilterIndex(null);
    };




    function getParametersInputs(filter) {
        return filter.parameters
            .filter(parameter => parameter.parameter_type !== "ptNull")
            .map((parameter, index) => (
                <Container key={index} className="flex-column">
                    <Row style={{paddingTop: "10px"}}>
                        <Col xs={6} md={6}>
                            <p>{parameter.ui_parameter_name}</p>
                            <p className="small text-muted">{parameter.ui_parameter_tooltip ? (parameter.ui_parameter_tooltip) : ("")}</p>
                        </Col>
                        <Col lg={6} md={6}>
                            <ParameterInput parameter={parameter} signals={availableSignals}/>
                            <Form.Text id={parameter.ui_parameter_name} muted>
                                {parameter.parameter_type}
                            </Form.Text>
                        </Col>
                        <hr/>
                    </Row>
                </Container>
            ))
    }

    return (
        <Container className={"container"}>

            {showErrorAlert && (
                <Alert variant="danger" onClose={() => setShowErrorAlert(false)} dismissible
                       className="position-relative top-0 start-0 w-100">
                    <Alert.Heading>Error</Alert.Heading>
                    <p>{errorMessage}</p>
                </Alert>
            )}
            <Container className=" mt-3 justify-content-around">


                {/* Loading overlay */}
                {showSpinner && (
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100 d-flex
                    justify-content-center align-items-center bg-dark bg-opacity-50"
                        style={{zIndex: 1050}}>
                        <Spinner animation="border" variant="light"/>
                    </div>
                )}
                {/* Applied Filters Section */}
                <Row className="">
                    <Col md={6} className="d-flex">
                        <Card className="card applied-filters w-100">
                            <Card.Body>
                                <Container className="container flex-column gap-5">
                                    <Card.Title as="h3">Applied Filters</Card.Title>
                                    <ListGroup className="overflow-y-scroll" style={{maxHeight: "400px"}}>
                                        {appliedFilters.length > 0 ? (
                                            appliedFilters.map((filter, index) => (
                                                <ListGroup.Item
                                                    key={`${filter.guid}-${index}`}
                                                    className={`filter-item ${selectedFilterIndex === index ? 'selected' : ''}`}
                                                    action
                                                    onClick={() => setSelectedFilterIndex(index)}
                                                >
                                                    {filter.description}
                                                </ListGroup.Item>
                                            ))
                                        ) : (
                                            <ListGroup.Item className="filter-item">No filters applied.</ListGroup.Item>
                                        )}
                                    </ListGroup>
                                    <ButtonGroup className="mt-5">
                                        <Button variant="primary" onClick={handleConfigureFilter}
                                                disabled={selectedFilterIndex === null}>
                                            Configure
                                        </Button>
                                        <Button variant="warning" onClick={handleRemoveFilter}
                                                disabled={selectedFilterIndex === null}>
                                            Remove
                                        </Button>
                                        <Button variant="danger" onClick={handleRemoveAllFilters}
                                                disabled={appliedFilters.length === 0}>
                                            Remove All
                                        </Button>
                                        <Button variant="info" onClick={handleSaveConfiguration}
                                                disabled={appliedFilters.length === 0}>
                                            Save Configuration
                                        </Button>
                                    </ButtonGroup>
                                </Container>

                            </Card.Body>

                        </Card>
                    </Col>
                    <Col md={6} className="d-flex">
                        {/* Available Filters Section */}
                        <Card className="card available-filters w-100">
                            <Card.Body>
                                <Card.Title as="h3">Available Filters</Card.Title>
                                <ListGroup className="overflow-y-scroll" style={{maxHeight: "500px"}}>
                                    {availableFilters.map((filter) => (
                                        <ListGroup.Item
                                            key={filter.id}
                                            className="filter-item hoverable"
                                            action
                                            onClick={() => handleAddFilter(filter)}
                                        >
                                            {filter.description}
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Modal for Filter Configuration */}
                {appliedFilters[selectedFilterIndex] ?
                    (<Modal size={"lg"}
                            show={isParamModalOpen} onHide={() => setIsParamModalOpen(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Configure <b>{appliedFilters[selectedFilterIndex]?.description}</b></Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Container
                                className="
                            container bg-light text-black
                            flex-wrap flex-column justify-content-start"
                                style={{minHeight: 'auto'}}>
                                {getParametersInputs(appliedFilters[selectedFilterIndex])}
                            </Container>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setIsParamModalOpen(false)}>
                                Close
                            </Button>
                            <Button variant="primary" onClick={() => alert('Save configurations')}>
                                Save
                            </Button>
                        </Modal.Footer>
                    </Modal>) : ("")
                }

                {/* Modal for Save Configuration */}
                {
                    (<Modal size={"lg"}
                            show={isConfigModalOpen} onHide={() => setIsParamModalOpen(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Save Configuration</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Container
                                className="
                            container bg-light text-black
                            flex-wrap flex-column justify-content-start"
                                style={{minHeight: 'auto'}}>
                                <Form.Group>
                                    <Form.Label>Configuration File Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter file name"
                                        value={configFileName}
                                        onChange={handleFileNameChange}
                                        isInvalid={!!fileNameError}
                                    >
                                    </Form.Control>

                                    <Form.Control.Feedback type="invalid">{fileNameError}</Form.Control.Feedback>
                                    <Form.Text muted>
                                        Enter the name of the configuration file (without extension). Avoid special
                                        characters.
                                    </Form.Text>
                                </Form.Group>
                            </Container>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setIsParamModalOpen(false)}>
                                Close
                            </Button>
                            <Button variant="primary" onClick={() => handleDownload()}>
                                Download Configuration
                            </Button>
                        </Modal.Footer>
                    </Modal>)
                }

            </Container>
        </Container>

    );
}

export default FiltersPage;
