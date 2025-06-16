import { Utils as Uu5Utils, useState, useImperativeHandle } from "uu5g05";
import { Test } from "uu5g05-test";

function createRerenderableComponent(render, initialProps) {
  let wrapperRef = Uu5Utils.Component.createRef();
  let Wrapper = Uu5Utils.Component.forwardRef(({ children }, ref) => {
    const [data, setData] = useState({ key: 0, props: initialProps });
    useImperativeHandle(
      ref,
      () => ({
        rerender: (newProps) => setData((curData) => ({ key: curData.key + 1, props: newProps })),
      }),
      [],
    );
    return render({ ...data.props, children });
  });
  return {
    rerender: (newProps) => Test.act(() => wrapperRef.current?.rerender(newProps)),
    Component: (props) => <Wrapper {...props} ref={wrapperRef} />,
  };
}

export { createRerenderableComponent };
