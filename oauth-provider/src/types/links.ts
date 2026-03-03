export type ChildLink = {
    href: string;
    label: string;
    image?: string;
}

export type ParentLink = {
    href: string;
    label: string;
    children: ChildLink[];
}

export type BaseLink = {
    href: string;
    label: string;
    children?: never;
}

export type NavLink = BaseLink | ParentLink

export const hasChildren = (link: NavLink): link is ParentLink => {
    return 'children' in link && Array.isArray(link.children) && link.children.length > 0;
}