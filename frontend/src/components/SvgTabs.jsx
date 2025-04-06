import {Container, Tabs, Tab} from "react-bootstrap";
import PropTypes from "prop-types";
import {useRef, useState} from "react";

export const SvgTabs = ({ svgs }) => {
    return (
        <Container className="p-1">
            <Tabs defaultActiveKey="0" id="svg-tabs" className="mb-3">
                {svgs.map((svg, index) => (
                    <Tab
                        eventKey={index.toString()}
                        title={svg.name || `Graf ${index + 1}`}
                        key={index}
                    >
                        <DraggableSvg svgHtml={svg.svg_str} />
                    </Tab>
                ))}
            </Tabs>
        </Container>
    );
};

const DraggableSvg = ({ svgHtml }) => { // TODO probably add scaling
    const wrapperRef = useRef(null);
    const innerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
    // console.log("svgHtml:", svgHtml);

    const onMouseDown = (e) => {
        setIsDragging(true);
        setStartDrag({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const onMouseMove = (e) => {
        if (!isDragging) return;
        const newX = e.clientX - startDrag.x;
        const newY = e.clientY - startDrag.y;
        setPosition({ x: newX, y: newY });
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
                dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
        </div>
    );
};

SvgTabs.propTypes = {
    svgs: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string,
            svg_str: PropTypes.string.isRequired,
        })
    ).isRequired,
};