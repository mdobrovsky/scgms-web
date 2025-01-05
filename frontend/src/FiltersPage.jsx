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
                const response = await axios.get('http://127.0.0.1:5000/fetch_filters');

                let filters = response.data.split("\n").filter(line => line.trim() !== "");

                // Vytvoření pole dvojic {name, guid}
                const parsedFilters = filters.map(filter => {
                    const match = filter.match(/^(.*)\{([A-F0-9-]+)\}$/);
                    if (match) {
                        const name = match[1].trim(); // Jméno filtru
                        const guid = match[2];       // GUID
                        return { name, guid };
                    }
                    return null; // Pro případ, že by řádek nesplňoval formát
                }).filter(item => item !== null); // Odstranění neplatných záznamů

                console.log(parsedFilters);

                setAvailableFilters(parsedFilters);
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
                            {filter.name}
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
                        {filter.name}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default FiltersPage;
