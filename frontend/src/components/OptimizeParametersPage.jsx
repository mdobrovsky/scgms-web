import {Alert, Modal, Button, Container, Row, Col, Form} from "react-bootstrap";
import React from "react";
import {findCorrespondingModelName} from "../services/utils.jsx";
import PropTypes from "prop-types";
import {toast} from "react-toastify";
import {executeConfiguration, fetchLogs, fetchSvgs} from "../services/configService.jsx";
import {fetchSolverProgress, solve} from "../services/optimizationService.jsx";


const OptimizeParametersPage = ({solvers, filters, models, onSolveFinished}) => {
        const [filtersToOptimize, setFiltersToOptimize] = React.useState([]);

        React.useEffect(() => {
            const optimizedFilters = filters.filter((filter) =>
                filter.parameters.some(
                    (p) =>
                        p.parameter_type === "ptDouble_Array" &&
                        (p.config_parameter_name === "Model_Bounds" || p.config_parameter_name === "Parameters")
                )
            );
            setFiltersToOptimize(optimizedFilters);


        }, [filters]);

        const handleSolve = async () => {
            const selectedOptions = document.querySelectorAll("#formMultiSelect option:checked");
            const selectedFilterIndexes = Array.from(selectedOptions).map((option) => option.value);
            console.log("Selected values:", selectedFilterIndexes);
            // go through selectedFilterIndexes and get the parameter names from filters
            const parameterNames = selectedFilterIndexes.map((index) => {
                const filter = filters[index];
                const parameterName = getParameterNameFromFilter(filter);
                return parameterName;
            })
            console.log("Parameter names:", parameterNames);

            const solver = document.querySelector("#formSolver").value;
            console.log("Selected solver:", solver);

            const maxGenerations = document.querySelector("#formMaxGenerations").value;
            console.log("Max generations:", maxGenerations);

            const populationSize = document.querySelector("#formPopulationSize").value;
            console.log("Population size:", populationSize);

            await toast.promise(
                new Promise(async (resolve, reject) => {
                        try {

                            const result = await solve(selectedFilterIndexes, solver, maxGenerations,
                                populationSize, parameterNames);
                            if (result === "0"){
                                // const solveIntervalId = setInterval(async () => {
                                //     try {
                                //         const progress = await fetchSolverProgress();
                                //         // SVGS
                                //         console.log("Solver progress:", progress);
                                //         if (progress.status === "Cancelled" || progress.status === "Stopped") {
                                //             clearInterval(solveIntervalId);
                                //         }
                                //     } catch (err) {
                                //         console.error("Error solving:", err);
                                //     }
                                //
                                // }, 1000);
                                const progress = await fetchSolverProgress();
                                console.log("Solver progress:", progress);
                                resolve("Optimization started successfully");
                                await onSolveFinished();
                            }
                            else {
                                reject(new Error("Error starting optimization"));
                            }
                        } catch
                            (err) {
                            reject(err);
                        }
                    }
                ),
                {
                    pending: "Starting optimization...",
                    success:
                        {
                            render({data}) {
                                return data; // render success message
                            }
                            ,
                            icon: "✅"
                        }
                    ,
                    error: {
                        render({data}) {
                            return `Error: ${data?.message || "Unknown error"}`;
                        }
                    }
                }
            )

        }

        const getParameterNameFromFilter = (filter) => {
            // return "Parameters" if it has Parameters, return "Model_Bounds" if it has Model_Bounds
            const parameter = filter.parameters.find((p) => p.config_parameter_name === "Parameters");
            if (parameter) {
                return "Parameters";
            }
            const modelBounds = filter.parameters.find((p) => p.config_parameter_name === "Model_Bounds");
            if (modelBounds) {
                return "Model_Bounds";
            }

        }


        return (
            <Container fluid className="my-4 p-4">
                <Row>
                    <Col>

                        <Form.Group controlId="formMultiSelect" className="mb-3">
                            <Form.Label>Parameters</Form.Label>
                            <Form.Select multiple size={6}>
                                {filtersToOptimize.map((filter, index) => (
                                    <option key={index} value={filter.index}>
                                        [{filter.index}] {filter.description} - {findCorrespondingModelName(filter, models)}

                                    </option>))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Form.Group controlId="formSolver" className="mb-3">
                            <Form.Label>Solver</Form.Label>
                            <Form.Select>
                                <option value="">Select a solver...</option>
                                {solvers.map((solver, index) => (
                                    <option key={index} value={solver.id}>{solver.description}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Form.Group controlId={"formMaxGenerations"} className="mb-3">
                            <Form.Label>Maximum generations</Form.Label>
                            <Form.Control type="number"
                                          defaultValue={"100"}

                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Form.Group controlId={"formPopulationSize"} className="mb-3">
                            <Form.Label>Population Size</Form.Label>
                            <Form.Control type="number"
                                          defaultValue={"20"}

                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Alert variant="secondary">
                            <p className="mb-1">
                                To enable parameters&#39; optimization, the filter chain must contain:
                            </p>
                            <ul className="mb-0">
                                <li>
                                    a) at least one filter with configured and saved parameters (configure, commit and save)
                                </li>
                                <li>
                                    b) at least one (maximum 10), configured Signal Error filter(s) (higher priority first)
                                </li>
                                <li>
                                    c) exactly one filter must emit Shutdown, and any feedback receiver cannot precede this
                                    filter
                                </li>
                            </ul>
                            <p className="mt-2 mb-0">
                                Parameters with improved fitness are applied automatically.
                            </p>
                        </Alert>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <p>Solver progress</p>
                        <div className="overflow-auto" style={{height: "200px"}}>
                            <p>Progress will be displayed here...</p>
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col className="d-flex flex-row gap-3">
                        <Button onClick={handleSolve} variant="outline-dark" className="mt-3"
                                style={{width: '150px'}}>Solve</Button>
                        <Button variant="outline-dark" className="mt-3" style={{width: '150px'}}>Stop</Button>
                    </Col>
                </Row>


            </Container>
        );
    }
;

OptimizeParametersPage.propTypes = {
    solvers: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
        })
    ).isRequired,
    filters: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
            parameters: PropTypes.arrayOf(
                PropTypes.shape({
                    parameter_type: PropTypes.string.isRequired,
                    config_parameter_name: PropTypes.string.isRequired,
                })
            ).isRequired,
        })
    ).isRequired,
    models: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
        })
    ).isRequired,
}


export default OptimizeParametersPage;
