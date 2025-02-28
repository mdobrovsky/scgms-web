import React, {useState, useEffect} from "react";
import {Container, Row, Col} from "react-bootstrap";
import AvailableFilterList from "../components/AvailableFilterList.jsx";
import FilterConfigModal from "../components/FilterConfigModal";
import SaveConfigModal from "../components/SaveConfigModal";
import {fetchFilters, addFilter, removeFilter} from "../services/filterService";
import {fetchSignals} from "../services/signalService";
import {saveConfiguration} from "../services/configService.jsx";
import SelectedFilterList from "../components/SelectedFilterList.jsx";

function FiltersPage() {
    const [availablefFilters, setAvailableFilters] = useState([]);
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [signals, setSignals] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [fileName, setFileName] = useState("");
    const [fileNameError, setFileNameError] = useState("");

    useEffect(() => {
        fetchFilters().then(setAvailableFilters);
        fetchSignals().then(setSignals);
    }, []);

    const handleAddFilter = async (filter) => {
        const result = await addFilter(filter.id);
        if (result === "0") {
            setSelectedFilters([...selectedFilters, filter]);
        }
    }

    const handleConfigureFilter = () => {
        setShowConfigModal(true);
    }

    const handleRemoveFilter = async (filter) => {
        console.log("Removing filter:", filter);
        // send index instead of filter object
        const result = await removeFilter(selectedFilters.indexOf(filter));
        if (result === "0") {
            setSelectedFilters(selectedFilters.filter(f => f.id !== filter.id));

        }
    }

    const handleRemoveAllFilters = async () => {
        const filtersToRemove = [...selectedFilters];
        const successfullyRemovedFilters = [];
        for (let i = filtersToRemove.length - 1; i >= 0; i--) {
            const result = await removeFilter(i);
            if (result === 1) {
                console.error(`Error removing filter at index ${i}`);
                break;
            }
            successfullyRemovedFilters.push(filtersToRemove[i]);

        }
        setSelectedFilter(null);
        setSelectedFilters(selectedFilters.filter(f => !successfullyRemovedFilters.includes(f)));
    }

    const handleSaveConfiguration = () => {
        setShowSaveModal(true)
    }

    return (
        <Container>
            <Container className="mt-5 mb-5">
                <Row className="align-items-stretch gap-3 flex-lg-nowrap">
                    <Col xs={12} md={12} lg={6}>
                        <SelectedFilterList
                            filters={selectedFilters}
                            onFilterSelect={setSelectedFilter}
                            handleConfigureFilter={handleConfigureFilter}
                            handleRemoveFilter={handleRemoveFilter}
                            handleRemoveAllFilters={handleRemoveAllFilters}
                            handleSaveConfiguration={handleSaveConfiguration}
                        />
                    </Col>
                    <Col xs={12} md={12} lg={6}>
                        <AvailableFilterList filters={availablefFilters} onFilterSelect={handleAddFilter}/>
                    </Col>
                </Row>
            </Container>

            <FilterConfigModal filter={selectedFilter} show={showConfigModal}
                               onClose={() => setShowConfigModal(false)}
                               signals={signals}
            />
            <SaveConfigModal show={showSaveModal} onClose={() => setShowSaveModal(false)}
                             fileName={fileName} setFileName={setFileName} fileNameError={fileNameError}
                             setFileNameError={setFileNameError}
                             onSave={() => saveConfiguration(fileName)}

            />
        </Container>
    );
}

export default FiltersPage;
