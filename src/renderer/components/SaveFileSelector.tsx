import { MoreVert } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { GameOfOriginData } from 'consts';
import { useEffect, useState } from 'react';
import { readSaveRefs } from 'renderer/util/ipcFunctions';
import { getGameLogo } from 'renderer/util/PokemonSprite';
import { getSaveTypeString, SaveRef } from 'types/types';
import OpenHomeButton from './buttons/OpenHomeButton';

interface SaveFileSelectorProps {
  onSelectFile: (filePath: string) => void;
  onImportSave: () => void;
}

const getSaveLogo = (ref: SaveRef) => {
  if (ref.game) {
    return getGameLogo(parseInt(ref.game ?? '0'));
  }
};

const SaveFileSelector = (props: SaveFileSelectorProps) => {
  const { onSelectFile, onImportSave } = props;
  const [saveFileRefs, setSaveFileRefs] = useState<{ [key: string]: SaveRef }>(
    {}
  );
  useEffect(() => {
    readSaveRefs((saveRefs) => setSaveFileRefs(saveRefs ?? {}));
  }, []);
  return (
    <div
      className="scroll-no-bar"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        position: 'relative',
        padding: 5,
        overflow: 'scroll',
      }}
    >
      <OpenHomeButton
        onClick={onImportSave}
        style={{
          width: 'calc(50% - 10px)',
          height: 150,
          margin: 5,
          padding: 10,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          opacity: 0.5,
          boxShadow:
            '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
        }}
      >
        <div
          style={{
            fontSize: 40,
            margin: 'auto',
          }}
        >
          +
        </div>
      </OpenHomeButton>
      {Object.values(saveFileRefs).map((ref) => (
        <OpenHomeButton
          onClick={() => onSelectFile(ref.filePath)}
          style={{
            width: 'calc(50% - 10px)',
            height: 150,
            margin: 5,
            padding: 10,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow:
              '0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)',
          }}
        >
          <img
            width={150}
            src={getSaveLogo(ref)}
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translate(0%, -50%)',
              opacity: 0.3,
              zIndex: 0,
            }}
          />
          <div
            style={{
              textAlign: 'left',
              width: '100%',
              fontSize: 20,
              zIndex: 2,
            }}
          >
            <div style={{ fontWeight: 'bold' }}>
              {ref.game
                ? `Pokémon ${GameOfOriginData[parseInt(ref.game)]?.name}`
                : getSaveTypeString(ref.saveType)}
            </div>
            <div>
              <span style={{ fontWeight: 'bold' }}>{ref.trainerName}</span>
              {` (ID ${ref.trainerID})`}
            </div>
          </div>
          <div
            style={{
              zIndex: 2,
              textOverflow: 'ellipsis',
              overflowX: 'hidden',
              textAlign: 'right',
              direction: 'rtl',
              color: '#333',
            }}
          >
            {ref.filePath}
          </div>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
            }}
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              zIndex: 3,
            }}
          >
            <MoreVert />
          </IconButton>
        </OpenHomeButton>
      ))}
    </div>
  );
};

export default SaveFileSelector;
