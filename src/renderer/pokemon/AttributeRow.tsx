const AttributeRow = (props: {
  label: string;
  value?: string;
  justifyEnd?: boolean;
  indent?: number;
  children?: any;
}) => {
  const { label, value, justifyEnd, indent, children } = props;
  return (
    <div
      style={{
        minHeight: 30,
        height: 30,
        borderBottom: '2px solid #bbb0',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <div
        style={{
          width: indent ? `calc(33% - ${indent + 1}px)` : '33%',
          height: '100%',
          backgroundColor: '#fff6',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 10,
          marginLeft: indent,
        }}
      >
        {label}
      </div>
      <div
        style={{
          width: '67%',
          height: '100%',
          padding: '0px 10px',
          backgroundColor: '#6662',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: justifyEnd ? 'end' : 'start',
          textAlign: justifyEnd ? 'end' : 'start'
        }}
      >
        {value ?? children}
      </div>
    </div>
  );
};

export default AttributeRow;
