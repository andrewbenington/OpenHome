import { Button, MenuItem, Pagination, Select } from "@mui/material";
import { useEffect, useState } from "react";
import { FileContent, useFilePicker } from "use-file-picker";
import PokemonDisplay from "./components.ts/PokemonDisplay";
import { colopkm } from "./pkm/colopkm";
import { pa8 } from "./pkm/pa8";
import { pb7 } from "./pkm/pb7";
import { pk2 } from "./pkm/pk2";
import { pk3 } from "./pkm/pk3";
import { pk4 } from "./pkm/pk4";
import { pk5 } from "./pkm/pk5";
import { pk6 } from "./pkm/pk6";
import { pk7 } from "./pkm/pk7";
import { pk8 } from "./pkm/pk8";
import { pk9 } from "./pkm/pk9";
import { pkm } from "./pkm/pkm";
import { xdpkm } from "./pkm/xdpkm";
import { acceptableExtensions, bytesToPKM } from "./util/FileImport";
const _ = require("lodash");

export const PKMLoader = () => {
  const [openFileSelector, { filesContent, loading }] = useFilePicker({
    accept: acceptableExtensions,
    readAs: "ArrayBuffer",
  });
  const [mons, setMons] = useState<pkm[]>([]);
  const [propTab, setPropTab] = useState("summary");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  useEffect(() => {
    // getMoves();
  }, []);
  useEffect(() => {
    if (filesContent) {
      let fileMons = filesContent.map((fileContent) => {
        let bytes = new Uint8Array(
          fileContent.content as unknown as ArrayBuffer
        );
        let [extension] = fileContent.name.split(".").slice(-1);
        return bytesToPKM(bytes, extension);
      });
      setMons(fileMons);
      setPage(0);
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
      <Pagination
        count={Math.ceil(mons.length / 100)}
        page={page + 1}
        onChange={(_, p) => setPage(p - 1)}
      />
      {/* <TablePagination
        component="div"
        count={mons.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(event) => {
          setPageSize(parseInt(event.target.value));
        }}
      /> */}
    </>
  );
};
