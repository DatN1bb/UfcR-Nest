export interface UserData {
  id: string
  username: string
  email: string
  avatar?: string
  role?: { id: string; name: string }
}
