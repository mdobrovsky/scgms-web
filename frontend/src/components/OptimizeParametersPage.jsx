import {Alert, Modal, Button, Container, Row, Col, Form} from "react-bootstrap";


const OptimizeParametersPage = ({solvers}) => {


    return (
        <Container fluid className="my-4 p-4">
            <Row>
                <Col>

                    <Form.Group controlId="formMultiSelect" className="mb-3">
                        <Form.Label>Parameters</Form.Label>
                        <Form.Select multiple size={6}>
                            <option value="1">[7] Calculated signal – Physical activity detection</option>
                            <option value="2">[10] Signal generator – Bergman extended minimal model</option>
                            <option value="3">...</option>
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
                                    <option key={index} value={solver}>{solver.description}</option>
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
                                          defaultValue={"10000"}

                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Form.Group controlId={"formPopulationSize"} className="mb-3">
                            <Form.Label>Population Size</Form.Label>
                            <Form.Control type="number"
                                          defaultValue={"100"}

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
                                c) exactly one filter must emit Shutdown, and any feedback receiver cannot precede this filter
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
                    <Button variant="outline-dark" className="mt-3" style={{ width: '150px' }}>Solve</Button>
                    <Button variant="outline-dark" className="mt-3" style={{ width: '150px' }}>Stop</Button>
                </Col>
            </Row>


        </Container>
    );
};


export default OptimizeParametersPage;
