export interface Feedback {
    _id: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    message: string;
    createdAt: Date;
}
