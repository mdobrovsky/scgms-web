import {Card, ListGroup} from "react-bootstrap";
import PropTypes from "prop-types";

const AvailableFilterList = ({filters, onFilterSelect}) => {
    return (
        <Card className="p-3 mt-4">
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
