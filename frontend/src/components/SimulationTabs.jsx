import {Container, Tabs, Tab, Button} from "react-bootstrap";
import PropTypes from "prop-types";
import {useRef, useState} from "react";

export const SimulationTabs = ({svgs, logs, onDownload}) => {
    // console.log("logs:", logs)
    return (
        <Container className="p-1">
            <Tabs defaultActiveKey={svgs.length > 0 ? "0" : "logs"} id="svg-tabs" className="mb-3">
                {svgs && svgs.length > 0 && svgs.map((svg, index) => (
                    <Tab
                        eventKey={index.toString()}
                        title={svg.name || `Graf ${index + 1}`}
                        key={index}
                    >
                        <div className="d-flex flex-column align-items-center mb-3">
                            {/*<Button variant="outline-dark" className="mb-2">*/}
                            {/*    Download*/}
                            {/*</Button>*/}
                            <DraggableSvg svgHtml={svg.svg_str}
                                          onDownload={() => onDownload(svg.name + ".svg", svg.svg_str)}/>
                        </div>

                    </Tab>
                ))}
                {logs && logs.length > 0 && (

                    <Tab className="shadow" eventKey="logs" title={`Logs (${logs.length})`} key="logs">
                        <Button
                            variant="outline-dark"
                            onClick={() => onDownload("log.csv", logs)}
                            className="container"
                        >
                            Download
                        </Button>
                        <div style={{
                            maxHeight: "600px",
                            overflowY: "auto",
                            background: "#f1f1f1",
                            padding: "1rem",
                            fontFamily: "monospace",
                            fontSize: "0.85rem",
                            whiteSpace: "pre-wrap"
                        }}>

                            {logs.map((log, i) => (
                                <div key={i}>{log}</div>
                            ))}

                        </div>
                    </Tab>
                )}
            </Tabs>
        </Container>
    );
};

const DraggableSvg = ({svgHtml, onDownload}) => { // TODO probably add scaling
    const wrapperRef = useRef(null);
    const innerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({x: 0, y: 0});
    const [startDrag, setStartDrag] = useState({x: 0, y: 0});
    // console.log("svgHtml:", svgHtml);

    const onMouseDown = (e) => {
        setIsDragging(true);
        setStartDrag({x: e.clientX - position.x, y: e.clientY - position.y});
    };

    const onMouseMove = (e) => {
        if (!isDragging) return;
        const newX = e.clientX - startDrag.x;
        const newY = e.clientY - startDrag.y;
        setPosition({x: newX, y: newY});
    };

    const onMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div
            ref={wrapperRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            className="shadow"
            style={{
                width: "800px",
                height: "600px",
                overflow: "scroll",
                border: "1px solid #ccc",
                background: "#f8f9fa",
                position: "relative",
                cursor: isDragging ? "grabbing" : "grab",
                margin: "0 auto"
            }}
        >

            <div
                ref={innerRef}
                style={{
                    position: "absolute",
                    left: position.x,
                    top: position.y,
                    width: "800px",
                    height: "400px",
                    pointerEvents: "none",
                    transform: "scale(1)",
                    transformOrigin: "top left",
                }}
                dangerouslySetInnerHTML={{__html: svgHtml}}
            />
            <Button
                variant="outline-dark"
                size="sm"
                onClick={onDownload}
                className="position-absolute top-0 end-0 m-2"
            >
                Download
            </Button>
        </div>
    );
};

DraggableSvg.propTypes = {
    svgHtml: PropTypes.string.isRequired,
    onDownload: PropTypes.func.isRequired,
}

SimulationTabs.propTypes = {
    svgs: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string,
            svg_str: PropTypes.string.isRequired,
        })
    ).isRequired,
    logs: PropTypes.arrayOf(PropTypes.string),
    onDownload: PropTypes.func.isRequired,
};