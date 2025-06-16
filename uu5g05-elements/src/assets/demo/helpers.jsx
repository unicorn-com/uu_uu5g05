import { Utils } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import { Config } from "uu5g05-dev";

function ComponentExampleTile({ name, parentStyle, children, docBaseUrl }) {
  return (
    <fieldset
      className={Config.Css.css({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
        borderWidth: 1,
        borderColor: Uu5Elements.UuGds.ColorPalette.getValue(["building", "dark", "softTransparent"]),
        borderRadius: Uu5Elements.UuGds.RadiusPalette.getValue(["box", "moderate"]),
        "&:hover": {
          borderColor: Uu5Elements.UuGds.ColorPalette.getValue(["building", "dark", "softStrongerSolidLight"]),
          "& > legend": {
            color: Uu5Elements.UuGds.ColorPalette.getValue(["building", "dark", "softStrongestSolidLight"]),
          },
        },
        ...parentStyle,
      })}
    >
      <legend
        className={Config.Css.css({
          color: Uu5Elements.UuGds.ColorPalette.getValue(["building", "dark", "softTransparent"]),
          paddingInline: 8,
          fontStyle: "italic",
          "&:hover": {
            textDecoration: "underline",
            cursor: "pointer",
          },
        })}
        onClick={() => window.open(docBaseUrl + name, "_blank")}
      >
        {name} <Uu5Elements.Icon icon="uugds-open-in-new" noPrint />
      </legend>
      {children}
    </fieldset>
  );
}

function IframeContent({ minHeight, children = "", title = "", scriptList, imports = "", ...props }) {
  const scriptEnd = "< /script>".replace(" ", "");
  const srcDoc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>

<script src="https://cdn.plus4u.net/uu-uu5loaderg01/1.0.0/uu5loaderg01.min.js" crossorigin="anonymous">${scriptEnd}
<script src="https://cdn.plus4u.net/uu-uu5g05/1.0.0/assets/example-config.js" crossorigin="anonymous">${scriptEnd}
${scriptList?.map((scriptUrl) => `<script src="${scriptUrl}" crossorigin="anonymous">${scriptEnd}`) ?? ""}
</head>
<body>
  <div id="uu5"></div>

  <script type="text/babel">
    import Uu5, { createComponent, createVisualComponent, Utils, useState, Fragment, useLsi } from "uu5g05";
    import Uu5Elements from "uu5g05-elements";
    import Uu5Forms from "uu5g05-forms";
    import Uu5Dev, { Config, LoremIpsum } from "uu5g05-dev";
    ${imports}

    const Page = createComponent({
      render() {
        return (
          ${children}
        );
      },
    });

    Utils.Dom.render(<Page />, document.getElementById("uu5"));
  ${scriptEnd}
</body>
</html>`;
  const attrs = Utils.VisualComponent.getAttrs(props);

  return (
    <iframe
      {...attrs}
      srcDoc={srcDoc}
      style={{ border: "none", height: "100%", width: "100%", ...attrs.style, minHeight }}
    />
  );
}

function ComponentOverview({ componentMap, blackList, library, docBaseUrl }) {
  const inlineList = [],
    spotList = [],
    areaList = [],
    missingList = [];

  for (let name in library) {
    const comp = componentMap[name];

    if (comp) {
      if (comp.type === "inline") inlineList.push({ ...comp, name });
      else if (comp.type === "spot") spotList.push({ ...comp, name });
      else areaList.push({ ...comp, name });
    } else if (!blackList.includes(name) && !name.match(/^[a-z_]|Provider$/)) {
      missingList.push({ name });
    }
  }

  return (
    <>
      <div className={Config.Css.css({ display: "flex", flexWrap: "wrap", gap: 8 })}>
        {inlineList.map(({ name, props, parentStyle, component: Component }) => {
          Component ||= library[name];
          return (
            <ComponentExampleTile key={name} name={name} parentStyle={parentStyle} docBaseUrl={docBaseUrl}>
              <Component {...props} />
            </ComponentExampleTile>
          );
        })}
      </div>
      <div
        className={Config.Css.css({
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 8,
          marginBottom: 8,
        })}
      >
        {spotList.map(({ name, props, parentStyle, component: Component }) => {
          Component ||= library[name];
          return (
            <ComponentExampleTile key={name} name={name} parentStyle={parentStyle} docBaseUrl={docBaseUrl}>
              <Component {...props} />
            </ComponentExampleTile>
          );
        })}
      </div>
      <Uu5Elements.Grid templateColumns="repeat(auto-fit, minmax(320px, 1fr))">
        {areaList.map(({ name, props, parentStyle, component: Component }) => {
          Component ||= library[name];
          return (
            <ComponentExampleTile key={name} name={name} parentStyle={parentStyle} docBaseUrl={docBaseUrl}>
              <div className={Config.Css.css({ width: "100%" })}>
                <Component {...props} />
              </div>
            </ComponentExampleTile>
          );
        })}
      </Uu5Elements.Grid>
      {missingList.length > 0 && (
        <div className={Config.Css.css({ marginTop: 8 })}>
          <h4>Missing components in demo</h4>
          <ul>
            {missingList.map(({ name }) => {
              return (
                <li key={name}>
                  <Uu5Elements.Link href={URL + name} target="_blank">
                    {name}
                  </Uu5Elements.Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

export { IframeContent, ComponentOverview };
