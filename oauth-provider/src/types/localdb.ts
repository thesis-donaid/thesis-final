import { Icon } from "next/dist/lib/metadata/types/metadata-types";

export interface Graduate {
  id: string;
  name: string;
  degree: string;
  school: string;
  graduationYear: number;
  image?: string;
  achievements?: string[];
  story: string;
}

export interface GraduateListProps {
  graduates: Graduate[];
}

export interface Users {
  name: string;
  age: number;
}


export interface Programs {
    id: number;
    title: string;
    icon: Icon;
    description: string;
}