import Context from "../utils/context";

const [ModalBusContext, useModalBusContext] = Context.create();

export { ModalBusContext, useModalBusContext };

ModalBusContext.useModalBusContext = useModalBusContext;
export default ModalBusContext;
