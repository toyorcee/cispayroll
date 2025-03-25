import { ComponentType } from "react";
import { Permission, UserRole } from "./auth";
import { SVGProps } from "react";

// Define the icon type
export type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavigationSubItem {
  name: string;
  href: string;
  roles?: UserRole[];
  permissions?: Permission[];
  requireAllPermissions?: boolean;
}

export interface NavigationItem {
  name: string;
  href: string;
  icon?: IconType;
  roles?: UserRole[];
  permissions?: Permission[];
  requireAllPermissions?: boolean;
  subItems?: NavigationSubItem[];
}
