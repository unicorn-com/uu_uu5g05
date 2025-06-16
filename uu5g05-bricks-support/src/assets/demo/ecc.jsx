import { useState, ToolbarProvider, SessionProvider, useSession } from "uu5g05";
import Uu5Elements from "uu5g05-elements";
import UuEcc from "uu_editablecomponentcontentg04";
import { Uu5String } from "uu5stringg01";
import { AuthenticationService } from "uu_appg01_oidc";

function Authenticated({ children }) {
  const { state, login } = useSession();
  return state === "authenticated" ? (
    children
  ) : state === "notAuthenticated" ? (
    <Uu5Elements.Button onClick={() => login()}>Login</Uu5Elements.Button>
  ) : null;
}

function UuEccPageEditButton() {
  const { editable, toggleEditable } = UuEcc.usePageEdit();

  return (
    <div style={{ textAlign: "right" }}>
      <Uu5Elements.Button
        colorScheme={editable ? "positive" : undefined}
        significance={editable ? "subdued" : undefined}
        onClick={() => toggleEditable()}
      >
        {editable ? "Stop editing" : "Edit"}
      </Uu5Elements.Button>
    </div>
  );
}

function UuEccPage({ children, initialEditable = true }) {
  return (
    <SessionProvider authenticationService={AuthenticationService}>
      <Authenticated>
        <UuEcc.PageEditProvider initialEditable={initialEditable}>
          <ToolbarProvider>
            <Uu5Elements.Toolbar />
            <UuEccPageEditButton />
            {children}
          </ToolbarProvider>
        </UuEcc.PageEditProvider>
      </Authenticated>
    </SessionProvider>
  );
}

function UuEccSection({ uu5String }) {
  const { editable, setReady } = UuEcc.usePageEdit();
  const [data, setData] = useState(Uu5String.toObject(uu5String));

  return (
    <UuEcc.Section
      editable={editable}
      onEditReady={setReady}
      data={{ content: data }}
      state="ready"
      onUpdate={(e) => {
        setData(Uu5String.toObject(e.content));
        return e;
      }}
      onLock={() => null}
      onUnlock={() => null}
    />
  );
}

export { UuEccPage, UuEccSection };
