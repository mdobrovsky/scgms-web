import {Alert, Modal, Button, Container, Row, Col, Form, ProgressBar} from "react-bootstrap";
import React from "react";
import {findCorrespondingModelName} from "../services/utils.jsx";
import PropTypes from "prop-types";
import {toast} from "react-toastify";
import {executeConfiguration, fetchLogs, fetchSvgs} from "../services/configService.jsx";
import {fetchSolverProgress, solve, stopOptimization} from "../services/optimizationService.jsx";


const OptimizeParametersPage = ({solvers, filters, models, onSolveFinished}) => {
        const [filtersToOptimize, setFiltersToOptimize] = React.useState([]);
        const [solverIntervalId, setSolverIntervalId] = React.useState(null);
        const [isSolveDisabled, setIsSolveDisabled] = React.useState(false);
        const [isStopDisabled, setIsStopDisabled] = React.useState(true);
        const [solverProgress, setSolverProgress] = React.useState({
            current_progress: "0",
            max_progress: "0",
            best_metric: "0",
            status: "Idle"
        });


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

        React.useEffect(() => {
            return () => {
                if (solverIntervalId) {
                    clearInterval(solverIntervalId);
                }
            };
        }, [solverIntervalId]);


        const handleStop = async () => {
            console.log("Stopping optimization...");
            await toast.promise(
                new Promise(async (resolve, reject) => {
                    try {
                        clearInterval(solverIntervalId);
                        const result = await stopOptimization();
                        if (result === "0") {
                            setIsStopDisabled(true);
                            setIsSolveDisabled(false);
                            await onSolveFinished();
                            resolve("Optimization stopped successfully");
                        } else {
                            reject(new Error("Error stopping optimization"));
                        }
                    } catch (err) {
                        reject(err);
                    }
                }),
                {
                    pending: "Stopping optimization...",
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
            const isValidMaxGen = maxGenerations >= 1;
            const isValidPopSize = populationSize >= 5;

            if (!isValidMaxGen) {
                toast.error("Parameter 'Max generations' should be: ≥ 1");
                return;
            }
            if (!isValidPopSize) {
                toast.error("Parameter 'Population size' should be: ≥ 1");
                return;
            }

            if (selectedFilterIndexes.length === 0) {
                toast.error("Please select at least one filter to optimize");
                return;
            }
            if (solver === "") {
                toast.error("Please select a solver");
                return;
            }
            await toast.promise(
                new Promise(async (resolve, reject) => {
                        try {

                            const result = await solve(selectedFilterIndexes, solver, maxGenerations,
                                populationSize, parameterNames);
                            if (result === "0") {
                                setIsSolveDisabled(true);
                                setIsStopDisabled(false);
                                const intervalId = setInterval(async () => {
                                    try {
                                        const progress = await fetchSolverProgress();
                                        console.log("Solver progress:", progress);
                                        setSolverProgress(progress);
                                        if (progress.status === "Cancelled" || progress.status === "Stopped") {
                                            clearInterval(intervalId)
                                            setIsSolveDisabled(false);
                                            setIsStopDisabled(true);
                                            if (progress.current_progress === progress.max_progress){
                                                progress.status = "Finished";
                                            }
                                            setSolverProgress(progress);
                                            await onSolveFinished();
                                        }
                                    } catch (err) {
                                        console.error("Error solving:", err);
                                    }

                                }, 1000);
                                setSolverIntervalId(intervalId);

                                resolve("Optimization started successfully");
                            } else {
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
                        <Row className="mb-3">
                            <Col>
                                <p>Solver progress</p>
                                <ProgressBar
                                    now={(solverProgress.max_progress > 0)
                                        ? (100 * solverProgress.current_progress / solverProgress.max_progress)
                                        : 0}
                                    animated
                                    striped
                                    variant="info"
                                    label={`${solverProgress.current_progress} / ${solverProgress.max_progress}`}
                                />
                                <div className="mt-2">
                                    <strong>Status:</strong> {solverProgress.status} <br/>
                                    <strong>Best metric:</strong> {solverProgress.best_metric}
                                </div>
                            </Col>
                        </Row>


                    </Col>
                </Row>
                <Row>
                    <Col className="d-flex flex-row gap-3">
                        <Button onClick={handleSolve} disabled={isSolveDisabled} variant="outline-dark" className="mt-3"
                                style={{width: '150px'}}>Solve</Button>
                        <Button onClick={handleStop} disabled={isStopDisabled} variant="outline-dark" className="mt-3"
                                style={{width: '150px'}}>Stop</Button>
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
