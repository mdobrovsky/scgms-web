import {Modal, Button, Container, Row, Col, Form, Spinner, Nav} from "react-bootstrap";
import ParameterInput from "./ParameterInput";
import PropTypes from "prop-types";
import React, {useRef, useEffect, useState} from "react";
import {configureFilter} from "../services/filterService";
import ModelBoundsEditableTable from "./ModelBoundsEditableTable.jsx";
import {toast} from 'react-toastify';
import {importCsvFiles} from "../services/configService.jsx";

const FilterConfigModal = ({
                               filter, setFilter, show, onClose, signals, models, metrics,
                               solvers, selectedModel, setSelectedModel, setSelectedFilters
                           }) => {
    const formRef = useRef(null);
    const [loading, setLoading] = useState(false);
    // Active tab in modal ("parameters" or "bounds")
    const [activeTab, setActiveTab] = useState("parameters");
    const [disableModelBoundsNav, setDisableModelBoundsNav] = useState(true);
    const [secondTabName, setSecondTabName] = useState("");
    const [csvFiles, setCsvFiles] = useState([]);

    // Disable 'Model Bounds' tab if no model is selected
    useEffect(() => {
        if (selectedModel) {
            setDisableModelBoundsNav(false);
        } else {
            setDisableModelBoundsNav(true);
            setActiveTab("parameters");
        }

    }, [selectedModel]);
    // Detect tab label based on parameter type
    useEffect(() => {
        filter.parameters.forEach((parameter) => {
            if (parameter.parameter_type === "ptDouble_Array") {
                if (parameter.config_parameter_name === "Model_Bounds") {
                    setSecondTabName("Model bounds");
                } else if (parameter.config_parameter_name === "Parameters") {
                    setSecondTabName("Parameters");
                }
            }

        })
    }, [filter]);

    const handleClose = () => {
        setActiveTab("parameters");
        setSelectedModel(null);
        setDisableModelBoundsNav(true);
        onClose();
    }

    if (!filter) return null;

    // Handle model bounds change
    const handleBoundsChange = (serializedBounds) => {
        const updatedParameters = filter.parameters.map((p) => {
            if (p.config_parameter_name === "Model_Bounds" && p.parameter_type === "ptDouble_Array") {
                return {
                    ...p,
                    value: serializedBounds.boundsString
                };
            }
            return p;
        });

        setFilter((prevFilter) => ({
            ...prevFilter,
            parameters: updatedParameters
        }));

    };

    // Called when user clicks 'Save changes'
    // Collects form values, updates local filter, and sends config to backend
    const handleSaveChanges = async () => {
        const formData = Object.fromEntries(new FormData(formRef.current).entries());

        if (!formData) return;
        const newParameters = filter.parameters.map((param) => {
            const element = formData[param.config_parameter_name];
            // console.log("form data: ", formData);

            let value;
            if (!element) {
                return {...param};
            }

            switch (param.parameter_type) {
                case "ptBool":
                    value = element ? "true" : "false";
                    break;
                case "ptSignal_Id":
                case "ptSignal_Model_Id":
                case "ptDiscrete_Model_Id":
                case "ptSolver_Id":
                case "ptModel_Produced_Signal_Id":
                    value = element || "";
                    break;
                case "ptRatTime": {
                    const [h, m, s] = element.split(":").map(Number);
                    console.log("Hours:", h, "Minutes:", m, "Seconds:", s);
                    const days = Number(formData[`${param.config_parameter_name}-days`]) || 0;
                    value = (days + h / 24 + m / 1440 + s / 86400).toString();
                    console.log("Value:", value.toString());
                    break;
                }
                default:
                    value = element;
                    break;
            }

            return {...param, value};
        });

        const updatedFilter = {...filter, parameters: newParameters};

        setSelectedFilters((prevFilters) =>
            prevFilters.map((f) => (f.index === updatedFilter.index ? updatedFilter : f))
        );

        setFilter(updatedFilter);

        console.log("Updated filter:", updatedFilter);

        await toast.promise(
            new Promise(async (resolve, reject) => {
                try {
                    if (csvFiles.length > 0) {
                        const csvResult = await importCsvFiles(csvFiles);
                        console.log("CSV import result:", csvResult);
                    }
                    const result = await configureFilter(updatedFilter);
                    if (result === "0") {
                        resolve("Filter configured successfully!");


                    } else {
                        reject(new Error("Error configuring filter"));
                    }
                } catch (err) {
                    reject(err);
                }
            }),
            {
                pending: "Configuring filter...",
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

        onClose();
    };

    return (
        <Modal size="lg" show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Configure <b>{filter.description}</b></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Nav fill variant="tabs" activeKey={activeTab} onSelect={(selectedKey) => setActiveTab(selectedKey)}>
                    <Nav.Item>
                        <Nav.Link eventKey="parameters">Main parameters</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="bounds" disabled={disableModelBoundsNav}>{secondTabName}</Nav.Link>
                    </Nav.Item>
                </Nav>
                <Container>
                    <Form ref={formRef}>
                        {activeTab === "parameters" && (
                            filter.parameters.filter((parameter) => parameter.parameter_type !== "ptDouble_Array")
                                .map((parameter, index) => (
                                    <Container key={index} className="flex-column">
                                        <Row style={{paddingTop: "10px"}}>
                                            <Col xs={6} md={6}>
                                                {parameter.parameter_type === "ptNull" ?
                                                    <p><b>{parameter.ui_parameter_name}</b></p>
                                                    : <p>{parameter.ui_parameter_name}</p>
                                                }

                                                <p className="small text-muted">{parameter.ui_parameter_tooltip ? parameter.ui_parameter_tooltip : ""}</p>
                                            </Col>
                                            <Col lg={6} md={6}>
                                                <ParameterInput
                                                    parameter={parameter}
                                                    signals={signals}
                                                    models={models}
                                                    solvers={solvers}
                                                    metrics={metrics}
                                                    selectedModel={selectedModel}
                                                    setSelectedModel={setSelectedModel}
                                                    setFilter={setFilter}
                                                    filter={filter}
                                                    setCsvFiles={setCsvFiles}
                                                />
                                                {/*<Form.Text id={parameter.ui_parameter_name} muted>*/}
                                                {/*    {parameter.parameter_type}*/}
                                                {/*</Form.Text>*/}
                                            {/*    a little space*/}
                                                <div style={{height: "10px"}}></div>
                                            </Col>
                                            <hr/>
                                        </Row>
                                    </Container>
                                ))
                        )}
                        {activeTab === "bounds" && selectedModel && (
                            <ModelBoundsEditableTable model={filter.model ?
                                filter.model : selectedModel}
                                                      values={filter.parameters.find((parameter) =>
                                                          parameter.parameter_type === "ptDouble_Array" &&
                                                          (parameter.config_parameter_name === "Model_Bounds" ||
                                                              parameter.config_parameter_name === "Parameters")
                                                      )?.value || ""}
                                                      onBoundsChange={handleBoundsChange}/>
                        )}
                    </Form>
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Close</Button>
                <Button variant="outline-dark" onClick={handleSaveChanges}>
                    <i className="bi-save"></i> Save changes {loading &&
                    <Spinner animation="border" role="status" size="sm"/>}

                </Button>
            </Modal.Footer>
        </Modal>
    );
};


FilterConfigModal.propTypes = {
    filter: PropTypes.shape({
        description: PropTypes.string.isRequired,
        parameters: PropTypes.arrayOf(
            PropTypes.shape({
                parameter_type: PropTypes.string.isRequired,
                ui_parameter_name: PropTypes.string.isRequired,
                ui_parameter_tooltip: PropTypes.string,
                value: PropTypes.any,
            })
        ).isRequired,
        model: PropTypes.shape({
            id: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            flags: PropTypes.string.isRequired,
        })
    }).isRequired,
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    signals: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            signal_description: PropTypes.string.isRequired,
        })
    ).isRequired,
    models: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            flags: PropTypes.string.isRequired,
        })
    ).isRequired,
    solvers: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
        })
    ).isRequired,
    selectedModel: PropTypes.shape({
        id: PropTypes.string,
        calculated_signal_ids: PropTypes.arrayOf(PropTypes.string),
    }),
    setSelectedModel: PropTypes.func.isRequired,
    setFilter: PropTypes.func.isRequired,
    setSelectedFilters: PropTypes.func.isRequired,
};
export default FilterConfigModal;
