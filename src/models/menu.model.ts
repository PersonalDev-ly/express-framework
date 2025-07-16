export interface MenuDTO {
  id?: number;
  parentId: number;
  name: string;
  path?: string;
  component?: string;
  icon?: string;
  sort?: number;
  visible?: boolean;
  redirect?: string;
  type?: number;
  perms?: string;
  status?: number;
}

export interface MenuTreeNode extends MenuDTO {
  children?: MenuTreeNode[];
}
