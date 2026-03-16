export interface Contact {
  _id?: string;
  fullName: string;
  email: string;
  phone?: string;
  message: string;
  submittedAt?: Date;
  status?: 'new' | 'read' | 'replied';
}

