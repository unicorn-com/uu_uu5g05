/**
 * Copyright (C) 2021 Unicorn a.s.
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License at
 * <https://gnu.org/licenses/> for more details.
 *
 * You may obtain additional information at <https://unicorn.com> or contact Unicorn a.s. at address: V Kapslovne 2767/2,
 * Praha 3, Czech Republic or at the email: info@unicorn.com.
 */

import React from "react";
import Element from "../utils/element.js";
import Telemetry from "../utils/telemetry";
import PropTypes from "../prop-types.js";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, componentStack: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    if (state.resetKey !== props.resetKey) {
      return { resetKey: props.resetKey, error: null, componentStack: null };
    }
    return null;
  }

  componentDidCatch(error, errorInfo) {
    Telemetry.error("uu5-errorBoundary", { error: error?.message, info: errorInfo });
    this.setState({ componentStack: errorInfo?.componentStack?.replace?.(/^\s*\n/, "") });
  }

  render() {
    let result;

    let { error, componentStack } = this.state;
    if (error != null) {
      let { fallback } = this.props;
      result =
        typeof fallback === "function"
          ? Element.create(fallback, { error, componentStack })
          : fallback !== undefined
            ? fallback
            : null;
    } else {
      result = this.props.children;
    }

    return result;
  }
}
ErrorBoundary.propTypes = {
  fallback: PropTypes.any,
  resetKey: PropTypes.any,
};
ErrorBoundary.defaultProps = {
  fallback: undefined,
  resetKey: undefined,
};

export { ErrorBoundary };
export default ErrorBoundary;
