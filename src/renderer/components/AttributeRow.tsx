const AttributeRow = (props: {
  label: string;
  value?: string;
  justifyEnd?: boolean;
  children?: any;
}) => {
  const { label, value, justifyEnd, children } = props;
  return (
    <div
      style={{
        height: 30,
        borderBottom: '2px solid #bbb0',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '30%',
          height: '100%',
          backgroundColor: '#fff6',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          width: '70%',
          height: '100%',
          padding: '0px 10px',
          backgroundColor: '#6662',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: justifyEnd ? 'end' : 'start',
        }}
      >
        {value ?? children}
      </div>
    </div>
  );
};

export default AttributeRow;
