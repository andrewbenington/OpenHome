import { Card } from "@mui/material";

const AttributeTag = (props: {
  color: string;
  backgroundColor: string;
  label?: string;
  icon?: string;
}) => {
  const { color, backgroundColor, label, icon } = props;
  return (
    <Card
      style={{
        marginRight: 5,
        marginBottom: 5,
        padding: icon ? "5px 5px 0px" : 5,
        width: "fit-content",
        fontWeight: "bold",
        color,
        backgroundColor,
      }}
    >
      {icon ? (
        <img
          alt={`${icon} icon`}
          src={process.env.PUBLIC_URL + icon}
          style={{
            height: 18,
            objectFit: "contain",
          }}
        />
      ) : (
        label ?? ""
      )}
    </Card>
  );
};
export default AttributeTag;
