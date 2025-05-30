import React from "react";
import {Button, ButtonGroup, Card, ListGroup} from "react-bootstrap";
import PropTypes from "prop-types";
import {moveFilterDown, moveFilterUp} from "../services/filterService.jsx";
import {updateFilterIndexes} from "../services/utils.jsx";
/**
 * SelectedFilterList.jsx
 *
 * Displays the list of applied filters with support for reordering (up/down), configuration,
 * and removal. Handles selection and state synchronization with the parent component.
 */

const SelectedFilterList = ({
                                filters, onFilterSelect, setSelectedFilters, handleConfigureFilter, handleRemoveFilter,
                                handleRemoveAllFilters
                            }) => {
    const [selectedFilter, setSelectedFilter] = React.useState(null);

    const handleSelectFilter = (filter) => {
        setSelectedFilter(filter);
        onFilterSelect(filter)
    }

    const handleMoveFilterUp = async () => {
        const index = filters.indexOf(selectedFilter);
        if (index > 0) {
            const result = await moveFilterUp(index);
            if (result === "0") {
                const newFilters = [...filters];
                newFilters.splice(index, 1);
                newFilters.splice(index - 1, 0, selectedFilter);
                const updated = updateFilterIndexes(newFilters);
                setSelectedFilters(updated);
                onFilterSelect(selectedFilter);
                setSelectedFilter(selectedFilter);
            }
        }
    }

    const handleMoveFilterDown = async () => {
        const index = filters.indexOf(selectedFilter);
        if (index < filters.length - 1) {
            const result = await moveFilterDown(index);
            if (result === "0") {
                const newFilters = [...filters];
                newFilters.splice(index, 1);
                newFilters.splice(index + 1, 0, selectedFilter);
                const updated = updateFilterIndexes(newFilters);
                setSelectedFilters(updated);
                onFilterSelect(selectedFilter);
                setSelectedFilter(selectedFilter);
            }
        }
    }

    const handleRemoveFilter2 = (filter) => {
        handleRemoveFilter(filter);
        setSelectedFilter(null);
    }

    const handleRemoveAllFilters2 = () => {
        handleRemoveAllFilters();
        setSelectedFilter(null);
    }
    return (
        <Card className="p-3 mt-4 h-100 shadow-sm" style={{height: "550px"}}>

            <Card.Title as="h3">Applied Filters</Card.Title>
            <ListGroup className="overflow-y-scroll" style={{height: "400px"}}>
                {filters.length > 0 ? (
                    filters.map((filter, index) => (
                        <ListGroup.Item
                            key={`${filter.guid}-${index}`}
                            // className={`filter-item ${selectedFilterIndex === index ? 'selected' : ''}`}
                            action
                            onClick={() => handleSelectFilter(filter)}
                            variant={selectedFilter === filter ? "dark" : ""}
                            onDoubleClick={handleConfigureFilter}
                        >
                            {filter.description}
                        </ListGroup.Item>
                    ))
                ) : (
                    <p className="p-3">No filters applied.</p>
                )}
            </ListGroup>
            <ButtonGroup className="mt-2 d-flex flex-column flex-lg-row">
                <Button variant="outline-dark" onClick={handleMoveFilterUp}
                        disabled={selectedFilter === null}>
                    <i className="bi-arrow-up"></i> Move up
                </Button>
                <Button variant="outline-dark" onClick={handleMoveFilterDown}
                        disabled={selectedFilter === null}>
                    <i className="bi-arrow-down"></i> Move down
                </Button>

            </ButtonGroup>
            <ButtonGroup className="mt-3 d-flex flex-column flex-lg-row">
                <Button variant="outline-dark" onClick={handleConfigureFilter}
                        disabled={selectedFilter === null}>
                    <i className="bi-wrench"></i> Configure
                </Button>
                <Button variant="outline-dark" onClick={() => handleRemoveFilter2(selectedFilter)}
                        disabled={selectedFilter === null}>
                    <i className="bi-x"></i> Remove
                </Button>
                <Button variant="outline-dark" onClick={handleRemoveAllFilters2}
                        disabled={filters.length === 0}>
                    <i className="bi-x-circle"></i> Remove All
                </Button>

            </ButtonGroup>
        </Card>
    );
};

SelectedFilterList.propTypes = {
    filters: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
        })
    ).isRequired,
    onFilterSelect: PropTypes.func.isRequired,
    setSelectedFilters: PropTypes.func.isRequired,
    handleConfigureFilter: PropTypes.func.isRequired,
    handleRemoveFilter: PropTypes.func.isRequired,
    handleRemoveAllFilters: PropTypes.func.isRequired,
};

export default SelectedFilterList;
