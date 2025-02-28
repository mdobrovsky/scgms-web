import React from "react";
import {Button, Card, Container, ListGroup} from "react-bootstrap";

const AvailableFilterList = ({filters, onFilterSelect}) => {
    return (
        <Card className="p-3 mt-4">
            <Card.Title as="h3">Available Filters</Card.Title>
            <ListGroup className="overflow-y-scroll" style={{height: "485px"}}>
                {/*<Container className="d-flex flex-wrap gap-2">*/}
                    {filters.length > 0 ? (
                        filters.map((filter, index) => (
                            <ListGroup.Item
                                key={`${filter.guid}-${index}`}
                                // className={`filter-item ${selectedFilterIndex === index ? 'selected' : ''}`}
                                action
                                onClick={() => onFilterSelect(filter)}
                            >
                                {filter.description}
                            </ListGroup.Item>
                        ))
                    ) : (
                        <p>No filters available.</p>
                    )}
                {/*</Container>*/}
            </ListGroup>
        </Card>
    );
};

/*
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
 */

export default AvailableFilterList;
