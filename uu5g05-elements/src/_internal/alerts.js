import { Lsi } from "uu5g05";
import importLsi from "../lsi/import-lsi.js";

const applicationNeedsReload = {
  message: <Lsi import={importLsi} path={["Alerts", "applicationNeedsReloadMessage"]} />,
  priority: "error",
  controlList: [
    {
      children: <Lsi import={importLsi} path={["Alerts", "applicationNeedsReloadReload"]} />,
      onClick: () => location.reload(),
      colorScheme: "primary",
      significance: "highlighted",
    },
  ],
};

export default { applicationNeedsReload };
