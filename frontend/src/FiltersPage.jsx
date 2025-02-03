import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Card, Button, ListGroup, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './FiltersPage.css'; // Ujisti se, že obsahuje tvé stylování

function FiltersPage() {
    const [availableFilters, setAvailableFilters] = useState([]);
    const [appliedFilters, setAppliedFilters] = useState([]);
    const [selectedFilterIndex, setSelectedFilterIndex] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:5000/fetch_filters');

                let filters = response.data.split("\n").filter(line => line.trim() !== "");

                const parsedFilters = filters.map(filter => {
                    const match = filter.match(/^(.*)\{([A-F0-9-]+)\}$/);
                    if (match) {
                        return { name: match[1].trim(), guid: match[2] };
                    }
                    return null;
                }).filter(item => item !== null);

                setAvailableFilters(parsedFilters);
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

    return (
        <Container className="container">
            {/* Applied Filters Section */}
            <Card className="card applied-filters">
                <Card.Body>
                    <Card.Title as="h3">Applied Filters</Card.Title>
                    <ListGroup>
                        {appliedFilters.length > 0 ? (
                            appliedFilters.map((filter, index) => (
                                <ListGroup.Item
                                    key={`${filter.guid}-${index}`}
                                    className={`filter-item ${selectedFilterIndex === index ? 'selected' : ''}`}
                                    action
                                    onClick={() => setSelectedFilterIndex(index)}
                                >
                                    {filter.name}
                                </ListGroup.Item>
                            ))
                        ) : (
                            <ListGroup.Item className="filter-item">No filters applied.</ListGroup.Item>
                        )}
                    </ListGroup>
                    {appliedFilters.length > 0 && (
                        <div className="actions">
                            <Button onClick={handleConfigureFilter} disabled={selectedFilterIndex === null}>
                                Configure
                            </Button>
                            <Button onClick={handleRemoveFilter} disabled={selectedFilterIndex === null}>
                                Remove
                            </Button>
                            <Button onClick={handleRemoveAllFilter}>
                                Remove All
                            </Button>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Available Filters Section */}
            <Card className="card available-filters">
                <Card.Body>
                    <Card.Title as="h3">Available Filters</Card.Title>
                    <ListGroup>
                        {availableFilters.map((filter, index) => (
                            <ListGroup.Item
                                key={index}
                                className="filter-item hoverable"
                                action
                                onClick={() => handleAddFilter(filter)}
                            >
                                {filter.name}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Card.Body>
            </Card>

            {/* Modal for Filter Configuration */}
            <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Configure Filter</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedFilterIndex !== null && (
                        <p>Filter Name: {appliedFilters[selectedFilterIndex].name}</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={() => alert('Save configurations')}>
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default FiltersPage;
