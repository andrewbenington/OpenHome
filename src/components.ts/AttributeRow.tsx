import { pkm } from "../pkm/pkm";

const AttributeRow = (props: {
  bottom?: boolean;
  label: string;
  value?: string;
  children?: any;
}) => {
  const { bottom, label, value, children } = { bottom: true, ...props };
  return (
    <div
      style={{
        borderBottom: "2px solid #bbb",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "30%",
          backgroundColor: "#ccc",
          padding: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          width: "70%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: value ? 10 : 0,
          paddingLeft: 10,
          paddingRight: 10,
        }}
      >
        {value ?? children}
      </div>
    </div>
  );
};

export default AttributeRow;
