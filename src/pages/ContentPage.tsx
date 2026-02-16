import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ContentPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/marketing/pipeline", { replace: true });
  }, [navigate]);
  return null;
}
