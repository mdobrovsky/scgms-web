import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {Container, Card, Button, ListGroup, Modal, Row, Col, Form, ButtonGroup} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// import './FiltersPage.css';

function FiltersPage() {
    const [availableFilters, setAvailableFilters] = useState([]);
    const [appliedFilters, setAppliedFilters] = useState([]);
    const [selectedFilterIndex, setSelectedFilterIndex] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                await axios.get('http://127.0.0.1:5000/fetch_filters')
                    .then((response) => {
                        setAvailableFilters(response.data.filters);
                        console.log(response.data.filters);
                    });

            } catch (error) {
                console.error('Error fetching filters:', error);
            }
        };

        fetchFilters();
    }, []);

    const handleAddFilter = (filter) => {
        setAppliedFilters([...appliedFilters, filter]);
    };

    const handleRemoveFilter = () => {
        if (selectedFilterIndex !== null) {
            setAppliedFilters(appliedFilters.filter((_, index) => index !== selectedFilterIndex));
            setSelectedFilterIndex(null);
        }
    };

    const handleConfigureFilter = () => {
        if (selectedFilterIndex !== null) {
            setIsModalOpen(true);
        }
    };

    const handleRemoveAllFilter = () => {
        setAppliedFilters([]);
        setSelectedFilterIndex(null);
    };


    function getParametersInputs(filter) {
        return (
            filter.parameters.map((parameter, index) => (
                <Container key={index} className="flex-column">
                    <Row style={{paddingTop: "10px"}}>
                        <Col xs={6} md={6}>
                            <p>{parameter.ui_parameter_name}</p>
                            <p className="small text-muted">{parameter.ui_parameter_tooltip ? (parameter.ui_parameter_tooltip) : ("")}</p>

                        </Col>
                        <Col lg={6} md={6}>
                            {parameter.parameter_type === "ptBool" ? (
                                <Form.Check
                                    type="switch"
                                    id={parameter.ui_parameter_name}
                                    label=""
                                />
                            ) : (
                                <Form.Control id={parameter.ui_parameter_name} type=""
                                              placeholder={parameter.ui_parameter_name}>
                                </Form.Control>)
                            }
                            <Form.Text id={parameter.ui_parameter_name} muted>
                                {parameter.parameter_type}
                            </Form.Text>
                        </Col>
                        <hr/>
                    </Row>
                </Container>
            )))
    }

    return (
        <Container className="container  align-items-baseline ">
            {/* Applied Filters Section */}
            <Card className="card applied-filters">
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
                        <ButtonGroup className="">
                            <Button variant="primary" onClick={handleConfigureFilter}
                                    disabled={selectedFilterIndex === null}>
                                Configure
                            </Button>
                            <Button variant="warning" onClick={handleRemoveFilter}
                                    disabled={selectedFilterIndex === null}>
                                Remove
                            </Button>
                            <Button variant="danger" onClick={handleRemoveAllFilter}
                                    disabled={appliedFilters.length === 0}>
                                Remove All
                            </Button>
                        </ButtonGroup>
                    </Container>

                </Card.Body>

            </Card>

            {/* Available Filters Section */}
            <Card className="card available-filters">
                <Card.Body>
                    <Card.Title as="h3">Available Filters</Card.Title>
                        <ListGroup className="overflow-y-scroll" style={{maxHeight: "500px"}} >
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

            {/* Modal for Filter Configuration */}
            {appliedFilters[selectedFilterIndex] ?
                (<Modal size={"lg"}
                        show={isModalOpen} onHide={() => setIsModalOpen(false)}>
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
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={() => alert('Save configurations')}>
                            Save
                        </Button>
                    </Modal.Footer>
                </Modal>) : ("")

            }

        </Container>
    );
}

export default FiltersPage;
