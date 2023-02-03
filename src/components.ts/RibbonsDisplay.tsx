import { Tooltip } from "@mui/material";
import { Gen9RibbonsPart2 } from "../consts/Ribbons";
import { pk3 } from "../pkm/pk3";
import { pkm } from "../pkm/pkm";

const getRibbonURL = (mon: pkm, ribbon: string) => {
  if (pkm instanceof pk3) {
  } else if (Gen9RibbonsPart2.indexOf(ribbon) > 33) {
    return `https://www.serebii.net/scarletviolet/ribbons/${ribbon
      .toLowerCase()
      .replaceAll(" ", "")}${ribbon.endsWith("Mark") ? "" : "ribbon"}.png`;
  } else {
    if (ribbon.endsWith("Mark")) {
      return `https://raw.githubusercontent.com/msikma/pokesprite/master/misc/mark/${ribbon
        .toLowerCase()
        .replaceAll(" ", "-")}.png`;
    } else {
      return `https://raw.githubusercontent.com/msikma/pokesprite/master/misc/ribbon/gen8/${ribbon
        .toLowerCase()
        .replaceAll(" ", "-")}-ribbon.png`;
    }
  }
};

const RibbonsDisplay = (props: { mon: pkm }) => {
  const { mon } = props;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        marginLeft: 10,
        padding: 10,
      }}
    >
      {mon.ribbons.map((ribbon) => (
        <Tooltip title={`${ribbon} ${ribbon.endsWith("Mark") ? "" : "Ribbon"}`}>
          <img
            alt={`${ribbon} ${ribbon.endsWith("Mark") ? "" : "Ribbon"}`}
            style={{ width: 50, height: 50 }}
            src={getRibbonURL(mon, ribbon)}
          />
        </Tooltip>
      ))}
    </div>
  );
};

export default RibbonsDisplay;
