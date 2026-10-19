import { createElement as h, Fragment } from "react";

export default function Content({ title, mainClassName = "", children }) {
  return h(
    Fragment,
    null,
    h("div", { className: "workspace-title" }, h("h1", null, title)),
    h("main", { id: "main", className: mainClassName }, children),
  );
}
