export interface Blog {
  _id?: string;
  title: string;
  description: string;
  content: string;
  image: string;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
  published?: boolean;
}

