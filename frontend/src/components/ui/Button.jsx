import { forwardRef } from "react";

// Small variant-driven button used in place of ad hoc inline-styled
// <button>s scattered across the app. Renders a plain native <button> so
// it stays keyboard/focus accessible for free. Forwards its ref so callers
// (e.g. ConfirmDialog auto-focusing Cancel) can still reach the DOM node.
const Button = forwardRef(function Button(
  {
    variant = "secondary", // primary | secondary | danger | success | ghost
    size = "md", // sm | md
    as: Tag = "button",
    type,
    className = "",
    children,
    ...rest
  },
  ref
) {
  const classes = ["ui-btn", `ui-btn-${variant}`, `ui-btn-${size}`, className]
    .filter(Boolean)
    .join(" ");

  const typeProp = Tag === "button" ? { type: type || "button" } : {};

  return (
    <Tag ref={ref} className={classes} {...typeProp} {...rest}>
      {children}
    </Tag>
  );
});

export default Button;
