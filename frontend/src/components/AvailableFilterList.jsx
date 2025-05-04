import {Card, ListGroup} from "react-bootstrap";
import PropTypes from "prop-types";
/**
 * AvailableFilterList.jsx
 *
 * A React component that displays a scrollable list of available filters.
 * Each filter is rendered as a clickable item; clicking triggers onFilterSelect.
 *
 */
const AvailableFilterList = ({filters, onFilterSelect}) => {
    return (
        <Card className="p-3 mt-4 h-100 shadow-sm" style={{height: "550px"}}>

            <Card.Title as="h3">Available Filters</Card.Title>
            <ListGroup className="overflow-y-scroll" style={{height: "485px"}}>
                {filters.length > 0 ? (
                    filters.map((filter, index) => (
                        <ListGroup.Item
                            key={`${filter.guid}-${index}`}
                            action
                            onClick={() => onFilterSelect(filter)}
                        >
                            {filter.description}
                        </ListGroup.Item>
                    ))
                ) : (
                    <p>No filters available.</p>
                )}
            </ListGroup>
        </Card>
    );
};


AvailableFilterList.propTypes = {
    filters: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            description: PropTypes.string.isRequired,
        })
    ).isRequired,
    onFilterSelect: PropTypes.func.isRequired,
};
export default AvailableFilterList;
