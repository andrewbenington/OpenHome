import BoxIcons from '../images/icons/BoxIcons.png';

export const initializeDragImage = () => {
  const dragIcon = document.createElement('img');
  dragIcon.id = 'drag-image';
  const dimension = window.outerWidth / 24 - 4;
  dragIcon.style.height = `${dimension}px`;
  dragIcon.style.width = `${dimension}px`;
  dragIcon.style.position = 'absolute';
  dragIcon.style.top = '-500px';
  dragIcon.style.opacity = "0.3";
  document.querySelector('body')?.appendChild(dragIcon);
};
