import { ComponentType, SVGProps } from "react";

export interface Stat {
  name: string;
  value: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
}
