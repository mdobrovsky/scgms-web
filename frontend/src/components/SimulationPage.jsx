import {Button, Col, Container, Image, Row} from "react-bootstrap";
import {SimulationTabs} from "./SimulationTabs.jsx";
import PropTypes from "prop-types";
/**
 * SimulationPage.jsx
 *
 * Main UI for controlling and visualizing a simulation.
 * Provides start/stop controls and displays simulation output (SVG plots and logs).
 */

export const SimulationPage = ({
                                   handleStartButton,
                                   isStartDisabled,
                                   isStopDisabled,
                                   handleStopButton,
                                   svgs,
                                   logs,
                                   onDownload
                               }) => {
    return (
        <Container fluid className="my-4">
            <Row>
                <Col md={2}>
                    <div className="d-flex flex-column gap-2">
                        <Button variant="outline-dark" disabled={isStartDisabled}
                                onClick={handleStartButton}><i className="bi-play"></i> Start</Button>
                        <Button variant="outline-dark" disabled={isStopDisabled}
                                onClick={handleStopButton}><i className="bi-stop"></i> Stop</Button>
                    </div>
                </Col>

                <Col md={8}>
                    <SimulationTabs svgs={svgs} logs={logs} onDownload={onDownload}/>
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
    onDownload: PropTypes.func.isRequired,
};