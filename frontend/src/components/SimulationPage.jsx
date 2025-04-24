import {Button, Col, Container, Image, Row} from "react-bootstrap";
import {SimulationTabs} from "./SimulationTabs.jsx";
import PropTypes from "prop-types";

export const SimulationPage = ({handleStartButton, isStartDisabled, isStopDisabled, handleStopButton, svgs, logs}) => {
    return (
        <Container fluid className="my-4">
            <Row>
                <Col md={2}>
                    <div className="d-flex flex-column gap-2">
                        <Button variant="outline-dark" disabled={isStartDisabled} onClick={handleStartButton}>Start</Button>
                        <Button variant="outline-dark" disabled={isStopDisabled} onClick={handleStopButton}>Stop</Button>
                    </div>
                </Col>

                <Col md={8}>
                    <SimulationTabs svgs={svgs} logs={logs} />
                </Col>


                <Col md={2}>
                    <div className="d-flex flex-column gap-2">
                        <h5>Time segments</h5>
                        <Button variant="outline-secondary">Example 1</Button>
                        <Button variant="outline-secondary">Example 2</Button>
                    </div>
                    <div className="d-flex flex-column gap-2 mt-5">
                        <h5>Signals</h5>
                        <Button variant="outline-secondary">Example 1</Button>
                        <Button variant="outline-secondary">Example 2</Button>
                    </div>
                </Col>
            </Row>
        </Container>
    )
}
SimulationPage.propTypes = {
    handleStartButton: PropTypes.func.isRequired,
    handleStopButton: PropTypes.func.isRequired,
    isStartDisabled: PropTypes.bool.isRequired,
    isStopDisabled: PropTypes.bool.isRequired,
    svgs: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string,
            svg_str: PropTypes.string.isRequired,
        })
    ).isRequired,
    logs: PropTypes.arrayOf(PropTypes.string).isRequired,
};