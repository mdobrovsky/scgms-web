import {useState, useEffect} from "react";
import {Container, Row, Col, Nav, Dropdown, Modal, Form, Button} from "react-bootstrap";
import AvailableFilterList from "../components/AvailableFilterList.jsx";
import FilterConfigModal from "../components/FilterConfigModal";
import SaveConfigModal from "../components/SaveConfigModal";
import {fetchFilters, addFilter, removeFilter, configureFilter} from "../services/filterService";
import {fetchSignals} from "../services/signalService";
import {fetchModels} from "../services/modelService.jsx";
import {fetchSolvers} from "../services/solverService.jsx";
import {
    saveConfiguration,
    loadConfiguration,
    fetchChainFilters,
    executeConfiguration, fetchSvgs, initConfiguration
} from "../services/configService.jsx";
import SelectedFilterList from "../components/SelectedFilterList.jsx";
import {fetchMetrics} from "../services/metricService.jsx";
import LoadConfigModal from "../components/LoadConfigModal.jsx";
import {toast} from "react-toastify";
import {updateFilterIndexes} from "../services/utils.jsx";
import {SimulationPage} from "../components/SimulationPage.jsx";

function MainPage() {
    const [availableFilters, setAvailableFilters] = useState([]);
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [signals, setSignals] = useState([]);
    const [models, setModels] = useState([]);
    const [solvers, setSolvers] = useState([]);
    const [metrics, setMetrics] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [fileName, setFileName] = useState("");
    const [fileNameError, setFileNameError] = useState("");
    const [activeTab, setActiveTab] = useState("configuration");
    const [file, setFile] = useState(null);
    const [svgs, setSvgs] = useState(null);
    const disableModelBoundsNav = selectedFilters.length === 0;

    useEffect(() => {
        fetchFilters().then(data => {
            console.log("Fetched Filters:", data);
            setAvailableFilters(data);
        });

        fetchSignals().then(data => {
            console.log("Fetched Signals:", data);
            setSignals(data);
        });

        fetchModels().then(data => {
            console.log("Fetched Models:", data);
            setModels(data);
        });

        fetchSolvers().then(data => {
            console.log("Fetched Solvers:", data);
            setSolvers(data);
        });

        fetchMetrics().then(data => {
            console.log("Fetched Metrics:", data);
            setMetrics(data);
        });
        fetchChainFilters().then(fetchedFilters => {
            console.log("Fetched Chain filters:", fetchedFilters);
                if (fetchedFilters.length > 0) {
                    const updated = updateFilterIndexes(fetchedFilters);
                    setSelectedFilters(updated);
                }
                else {
                    initConfiguration().then(data => {
                        console.log("Configuration initialized.");
                    })
                }
            }
        );

    }, []);


    const handleStartButton = async () => {
        await toast.promise(
            new Promise(async (resolve, reject) => {
                try {
                    const result = await executeConfiguration();
                    console.log("Execute Config Result:", result);
                    if (result === "0") {
                        const svgs = await fetchSvgs();
                        console.log("Fetched SVGs:", svgs);
                        if (svgs) {
                            setSvgs(svgs);
                            resolve("Simulation started successfully");
                        } else {
                            reject(new Error("Error starting simulation."));
                        }

                    } else {
                        reject(new Error("Error starting simulation."));
                    }
                } catch (err) {
                    reject(err);
                }
            }),
            {
                pending: "Starting simulation...",
                success: {
                    render({data}) {
                        return data; // render success message
                    },
                    icon: "✅"
                },
                error: {
                    render({data}) {
                        return `Error: ${data?.message || "Unknown error"}`;
                    }
                }
            }
        )
    }

    const handleAddFilter = async (filter) => {
        const result = await addFilter(filter.id);
        if (result === "0") {
            const updated = updateFilterIndexes([...selectedFilters, filter]);
            setSelectedFilters(updated);
        }
        console.log("Selected Filters:", selectedFilters);
        // add index atribute to filter object
    }

    const handleCloseConfigModal = () => {
        setShowConfigModal(false);
        setSelectedModel(null);
    }

    const handleConfigureFilter = () => {
        setShowConfigModal(true);
    }

    const handleRemoveFilter = async (filter) => {
        // console.log("Removing filter:", filter);
        // send index instead of filter object
        const result = await removeFilter(selectedFilters.indexOf(filter));
        if (result === "0") {
            setSelectedFilters(selectedFilters.filter(f => f.id !== filter.id));
            const updated = updateFilterIndexes([...selectedFilters, filter]);
            setSelectedFilters(updated);

        }
    }

    const handleLoadConfig = async (file) => {
        await toast.promise(
            new Promise(async (resolve, reject) => {
                try {
                    const result = await loadConfiguration(file);
                    console.log("Load Config Result:", result);
                    if (result === "0") {
                        const fetchedFilters = await fetchChainFilters();
                        if (fetchedFilters) {
                            const updated = updateFilterIndexes(fetchedFilters);
                            setSelectedFilters(updated);
                            setShowLoadModal(false)
                            resolve("Configuration loaded successfully");
                        } else {
                            reject(new Error("Error loading configuration"));
                        }
                    } else {
                        reject(new Error("Error loading configuration"));
                    }
                } catch (err) {
                    reject(err);
                }
            }),
            {
                pending: "Loading configuration...",
                success: {
                    render({data}) {
                        return data; // render success message
                    },
                    icon: "✅"
                },
                error: {
                    render({data}) {
                        return `Error: ${data?.message || "Unknown error"}`;
                    }
                }
            }
        )
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


    return (
        <Container>
            <Nav fill variant="tabs" activeKey={activeTab} className="mb-3 mt-4"
                 onSelect={(selectedKey) => setActiveTab(selectedKey)}>
                <Nav.Item>
                    <Nav.Link eventKey="configuration">Configuration</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="simulation" disabled={disableModelBoundsNav}>Simulation</Nav.Link>
                </Nav.Item>
            </Nav>
            {(activeTab === "configuration") && (
                <Container className="mt-1 mb-0">
                    <Dropdown className="">
                        <Dropdown.Toggle variant="outline-dark" id="dropdown-basic">
                            Configuration
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => setShowSaveModal(true)}>Save</Dropdown.Item>
                            <Dropdown.Item onClick={() => setShowLoadModal(true)}>Load</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                    <Row className="align-items-stretch gap-3 flex-lg-nowrap">
                        <Col xs={12} md={12} lg={6}>
                            <SelectedFilterList
                                filters={selectedFilters}
                                onFilterSelect={setSelectedFilter}
                                setSelectedFilters={setSelectedFilters}
                                handleConfigureFilter={handleConfigureFilter}
                                handleRemoveFilter={handleRemoveFilter}
                                handleRemoveAllFilters={handleRemoveAllFilters}
                            />
                        </Col>
                        <Col xs={12} md={12} lg={6}>
                            <AvailableFilterList filters={availableFilters} onFilterSelect={handleAddFilter}/>
                        </Col>
                    </Row>
                </Container>
            )}
            {activeTab === "simulation" && (
                <SimulationPage handleStartButton={handleStartButton} svgs={svgs}/>
            )}

            {selectedFilter && (
                <FilterConfigModal filter={selectedFilter} show={showConfigModal}
                                   onClose={handleCloseConfigModal}
                                   signals={signals}
                                   models={models}
                                   solvers={solvers}
                                   metrics={metrics}
                                   selectedModel={selectedModel}
                                   setSelectedModel={setSelectedModel}
                                   setFilter={setSelectedFilter}
                                   setSelectedFilters={setSelectedFilters}

                />
            )}
            <SaveConfigModal show={showSaveModal} onClose={() => setShowSaveModal(false)}
                             fileName={fileName}
                             setFileName={setFileName}
                             fileNameError={fileNameError}
                             setFileNameError={setFileNameError}
                             onSave={() => saveConfiguration(fileName)}

            />
            <LoadConfigModal show={showLoadModal} onClose={() => setShowLoadModal(false)}
                             setFile={setFile} onLoad={() => handleLoadConfig(file)}
            />

        </Container>
    );
}

export default MainPage;
