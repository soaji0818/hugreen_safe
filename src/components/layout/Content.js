import { createElement as h, Fragment } from "react";

export default function Content({ title, titleActions = null, mainClassName = "", children }) {
  return h(
    Fragment,
    null,
    h(
      "div",
      { className: "workspace-title" },
      h("h1", null, title),
      titleActions,
    ),
    h("main", { id: "main", className: mainClassName }, children),
  );
}
