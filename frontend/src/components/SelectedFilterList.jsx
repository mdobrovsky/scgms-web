import React from "react";
import {Button, ButtonGroup, Card, Container, ListGroup} from "react-bootstrap";

// eslint-disable-next-line react/prop-types
const SelectedFilterList = ({filters, onFilterSelect, handleConfigureFilter, handleRemoveFilter,
                                // eslint-disable-next-line react/prop-types
                                handleRemoveAllFilters, handleSaveConfiguration}) => {
    const [selectedFilter, setSelectedFilter] = React.useState(null);
    return (
        <Card className="p-3 mt-4">
            <Card.Title as="h3">Applied Filters</Card.Title>
            <ListGroup className="overflow-y-scroll" style={{height: "400px"}}>
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
                    <p className="p-3">No filters applied.</p>
                )}
            </ListGroup>
            <ButtonGroup className="mt-5 d-flex flex-column flex-lg-row">
                <Button variant="outline-dark" onClick={handleConfigureFilter}
                        disabled={selectedFilter === null}>
                    Configure
                </Button>
                <Button variant="outline-dark" onClick={handleRemoveFilter}
                        disabled={selectedFilter === null}>
                    Remove
                </Button>
                <Button variant="outline-dark" onClick={handleRemoveAllFilters}
                        disabled={filters.length === 0}>
                    Remove All
                </Button>
                <Button variant="outline-dark" onClick={handleSaveConfiguration}
                        disabled={filters.length === 0}>
                    Save Configuration
                </Button>
            </ButtonGroup>
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

export default SelectedFilterList;
