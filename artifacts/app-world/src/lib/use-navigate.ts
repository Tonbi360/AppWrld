import { useLocation } from "wouter";

export function useNavigate() {
  const [, setLocation] = useLocation();
  return { goTo: setLocation };
}
