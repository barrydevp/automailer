import {
  Link as RRDLink,
  LinkProps as RRDLinkProps,
  To,
} from "react-router-dom";

export interface LinkProps extends Omit<RRDLinkProps, "to"> {
  href: To;
}

export function Link({ href, ...props }: LinkProps) {
  return <RRDLink to={href} {...props} />;
}
