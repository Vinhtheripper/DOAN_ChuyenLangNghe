export class User {
  constructor(
    public _id: string | null = null,
    public profileName: string = "",
    public email: string = "",
    public password?: string,
    public gender?: string,
    public birthDate?: {
      day?: string,
      month?: string,
      year?: string
    },
    public marketing?: boolean,
    public phone?: string,
    public address?: string,
    public avatar?: string,
    public memberPoints?: number,
    public memberTier?: string,
    public role: 'user' | 'admin' = 'user',
    public action: 'edit all' | 'account ctrl' | 'sales ctrl' | 'just view' = 'just view'
  ) { }
}
