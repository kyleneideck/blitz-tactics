import { createApp } from 'vue'

import Infinity from './infinity.vue'

import './style.sass'
import './responsive.sass'

export type InfinityPuzzleDifficulty = 'easy' | 'medium' | 'hard' | 'insane'

export interface InfinityPuzzleSolved {
  puzzle_id: number,
  difficulty: InfinityPuzzleDifficulty
}

export default function InfinityMode() {
  const app = createApp(Infinity)
  app.mount('.infinity-mode .vue-app-mount')
}
