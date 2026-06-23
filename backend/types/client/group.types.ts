import { GroupVisibility } from "@prisma/client"

export interface groupTypeData{
  name:        string
  description?: string,
  avatarUrl?:   string,
  coverUrl?:    string,
  visibility?: GroupVisibility
} 