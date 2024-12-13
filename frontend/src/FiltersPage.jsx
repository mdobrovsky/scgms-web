import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FiltersPage.css'; // Add this for styling

function FiltersPage() {
    const [availableFilters, setAvailableFilters] = useState([]); // Dynamically fetched filters
    const [appliedFilters, setAppliedFilters] = useState([]);
    const [selectedFilterIndex, setSelectedFilterIndex] = useState(null);

    // Fetch available filters from the backend
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const response = await axios.get('http://localhost:3000/simulation/filters');
                setAvailableFilters(response.data.filters);
            } catch (error) {
                console.error('Error fetching filters:', error);
            }
        };

        fetchFilters().then(() => console.log("Filters fetched"));
    }, []);



    const handleAddFilter = (filter) => {
        setAppliedFilters([...appliedFilters, filter]);
    };

    const handleRemoveFilter = () => {
        if (selectedFilterIndex !== null) {
            const updatedFilters = [...appliedFilters];
            updatedFilters.splice(selectedFilterIndex, 1);
            setAppliedFilters(updatedFilters);
            setSelectedFilterIndex(null); // Reset selection
        }
    };

    const handleConfigureFilter = () => {
        if (selectedFilterIndex !== null) {
            const selectedFilter = appliedFilters[selectedFilterIndex];
            alert(`Configuring filter: ${selectedFilter}`);
        }
    };

    const handleRemoveAllFilter = () => {
        setAppliedFilters([]);
        setSelectedFilterIndex(null); // Reset selection
    };

    return (
        <div className="container">
            {/* Applied Filters Section */}
            <div className="card applied-filters">
                <h3>Applied Filters</h3>
                {appliedFilters.length > 0 ? (
                    appliedFilters.map((filter, index) => (
                        <div
                            key={`${filter}-${index}`}
                            className={`filter-item ${
                                selectedFilterIndex === index ? 'selected' : ''
                            }`}
                            onClick={() => setSelectedFilterIndex(index)}
                        >
                            {filter}
                        </div>
                    ))
                ) : (
                    <p>No filters applied.</p>
                )}
                {appliedFilters.length > 0 && (
                    <div className="actions">
                        <button onClick={handleConfigureFilter} disabled={selectedFilterIndex === null}>
                            Configure
                        </button>
                        <button onClick={handleRemoveFilter} disabled={selectedFilterIndex === null}>
                            Remove
                        </button>
                        <button onClick={handleRemoveAllFilter}>
                            Remove All
                        </button>
                    </div>
                )}
            </div>

            {/* Available Filters Section */}
            <div className="card available-filters">
                <h3>Available Filters</h3>
                {Array.isArray(availableFilters) && availableFilters.map((filter, index) => (
                    <div
                        key={index}
                        className="filter-item hoverable"
                        onClick={() => handleAddFilter(filter)}
                    >
                        {filter}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FiltersPage;
