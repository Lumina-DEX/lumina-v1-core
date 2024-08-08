import { Load } from "@/types/load";
import { create } from "zustand";

interface LoadState extends Load {
  update: (value: Partial<Load>) => void;
}

const useLoad = create<LoadState>((set) => ({
  msg: "",
  state: false,
  process: 0,
  update: (value: Partial<Load>) => {
    set((state) => ({ ...state, ...value }));
  },
}));

export default useLoad;
