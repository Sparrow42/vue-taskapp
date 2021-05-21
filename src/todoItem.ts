export enum State { All, Working, Done }

export interface TodoItem {
  id: number
  name: string
  state: State.Working | State.Done
  deadline: Date
  priority: string
  select: boolean
}
