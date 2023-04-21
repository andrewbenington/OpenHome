export interface OpenHomeTheme {
  name: string;
  backgroundColor: string;
  borderColor: string;
  contentColor: string;
}

const Themes: OpenHomeTheme[] = [
  {
    name: 'Default',
    backgroundColor: '#A9CEF4',
    borderColor: '#66A182',
    contentColor: '#CAFFB9',
  },
  {
    name: 'Vaporwave',
    backgroundColor: '#0C0A3E',
    borderColor: '#DE0D92',
    contentColor: '#686993',
  },
];

export default Themes;
