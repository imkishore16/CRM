import { create } from 'zustand'


type State = {
  campaignId: string | null
  caseId: string | null
  setCampaignId: (id: string) => void
  setCaseId: (id: string) => void
  reset: () => void
}

const useStore = create<State>((set) => ({
  campaignId: null,
  caseId: null,
  setCampaignId: (id) => set({ campaignId: id }),
  setCaseId: (id) => set({ caseId: id }),
  reset: () => set({ campaignId: null, caseId: null }),
}))

export default useStore