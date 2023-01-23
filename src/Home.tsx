import {
  Button,
  MenuItem, Select,
  TablePagination
} from "@mui/material";
import { useEffect, useState } from "react";
import { FileContent, useFilePicker } from "use-file-picker";
import PokemonDisplay from "./components.ts/PokemonDisplay";
import { colopkm } from "./pkm/colopkm";
import { pa8 } from "./pkm/pa8";
import { pb7 } from "./pkm/pb7";
import { pk3 } from "./pkm/pk3";
import { pk4 } from "./pkm/pk4";
import { pk5 } from "./pkm/pk5";
import { pk6 } from "./pkm/pk6";
import { pk7 } from "./pkm/pk7";
import { pk8 } from "./pkm/pk8";
import { pk9 } from "./pkm/pk9";
import { pokemon } from "./types/types";
const _ = require("lodash");

export const Home = () => {
  const [openFileSelector, { filesContent, loading }] = useFilePicker({
    accept: [
      ".pkm",
      ".colopkm",
      ".xdpkm",
      ".pk5",
      ".pk6",
      ".pk7",
      ".pb7",
      ".pk8",
      ".pa8",
      ".pb8",
      ".pk9",
    ],
    readAs: "ArrayBuffer",
  });
  const [mons, setMons] = useState<pokemon[]>([]);
  const [propTab, setPropTab] = useState("summary");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  useEffect(() => {
    // getMoves();
  }, []);
  useEffect(() => {
    if (filesContent) {
      let fileMons = filesContent.map((mon) => fileContentToMon(mon));
      setMons(fileMons);
      setPage(0)
    }
  }, [filesContent]);
  return (
    <>
      <div style={{ display: "flex" }}>
        <Button variant="contained" onClick={() => openFileSelector()}>
          Open PKM
        </Button>
        <Select
          value={propTab}
          onChange={(event) =>
            setPropTab((event?.target?.value as string) ?? "summary")
          }
        >
          <MenuItem value="summary">Summary</MenuItem>
          <MenuItem value="stats">Stats</MenuItem>
          <MenuItem value="ribbons">Ribbons</MenuItem>
          <MenuItem value="raw">Raw</MenuItem>
        </Select>
      </div>
      {mons?.slice(page * pageSize, (page + 1) * pageSize)?.map((mon) => (
        <PokemonDisplay mon={mon} propTab={propTab} />
      ))}
      <TablePagination
        component="div"
        count={mons.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(event) => {
          setPageSize(parseInt(event.target.value));
        }}
      />
    </>
  );
};

const fileContentToMon = (fileContent: FileContent): pokemon => {
  let bytes = new Uint8Array(fileContent.content as unknown as ArrayBuffer);
  if (
    fileContent.name?.endsWith(".colopkm") ||
    fileContent.name?.endsWith(".xdpkm")
  ) {
    return new colopkm(bytes);
  } else if (
    fileContent.name?.endsWith(".pk3") ||
    bytes.length === 100 ||
    bytes.length === 80
  ) {
    return new pk3(bytes);
  } else if (
    bytes[0x5f] < 20 &&
    (fileContent.name?.endsWith(".pk4") ||
      bytes.length === 136 ||
      bytes.length === 236)
  ) {
    return new pk4(bytes);
  } else if (
    fileContent.name?.endsWith(".pk5") ||
    bytes.length === 0xdc ||
    bytes.length === 0x88 ||
    bytes.length === 136
  ) {
    return new pk5(bytes);
  } else if (fileContent.name?.endsWith(".pk6")) {
    return new pk6(bytes);
  } else if (fileContent.name?.endsWith(".pk7")) {
    return new pk7(bytes);
  } else if (fileContent.name?.endsWith(".pb7")) {
    return new pb7(bytes);
  } else if (
    fileContent.name?.endsWith(".pk8") ||
    fileContent.name?.endsWith(".pb8")
  ) {
    return new pk8(bytes);
  } else if (bytes.length === 0x178) {
    return new pa8(bytes);
  } else {
    return new pk9(bytes);
  }
};
