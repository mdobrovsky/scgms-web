import {Button, Container} from "react-bootstrap";

export const SimulationPage = ({handleStartButton}) => {
    return (
        <Container>
            <Button variant="outline-dark" onClick={handleStartButton}>Start</Button>
        </Container>
    )

}