import {Button, Container, Image} from "react-bootstrap";

export const SimulationPage = ({handleStartButton, svgs}) => {
    return (
        <Container>
            <Button variant="outline-dark" onClick={handleStartButton}>Start</Button>
            {svgs && svgs.length > 0 && (
                <div className="container my-4 p-5">
                    {svgs.map((svg, index) => (
                        <div
                            key={index}
                            className="text-center border p-5 bg-light shadow"
                            dangerouslySetInnerHTML={{ __html: svg.svg_str }}
                        />
                    ))}
                </div>
            )}

        </Container>
    )

}