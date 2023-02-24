const AttributeRow = (props: {
  label: string;
  value?: string;
  children?: any;
}) => {
  const { label, value, children } = props;
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
          padding: 0,
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
